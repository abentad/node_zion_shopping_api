const { requireAuth } = require('../middleware/auth_middleware');
const path = require('path');
const mysqlConnection = require('../utils/database');
const router = require('express').Router();
const upload = require('../utils/multer');
const sharp = require('sharp');
const fs = require('fs');

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

//multer
const uploadProductImages = upload.array('gallery', 3);

const modifyProductImage =  async (req, res, next) => {
    const productImageList = [];
    try {
        for(var i = 0; i < req.files.length; i++){
            const fileName = 'uploads/products/' + 'product_' + Date.now() + '_' + getRandomInt(100) + getRandomInt(100) + '.jpg';
            console.log('called once for', req.files[i]);
            await sharp(req.files[i].buffer).jpeg({ quality: 70 }).toFile(fileName);
            productImageList.push(fileName);
        }
        req.files.path = productImageList;
    } catch (error) {
        console.log(error);
    }
    next();
}

//for posting a new product
router.post('/post', requireAuth, uploadProductImages, modifyProductImage, async (req,res)=>{
    console.log('product post called');
    const { name, isPending, views, price, description, category, datePosted, posterId, posterName, posterProfileAvatar, posterPhoneNumber} = req.body;
    let insertedProductId;
    let insertedProductImageId;
    try {
        mysqlConnection.query("INSERT INTO products(name, isPending, views, price, description, category, image, datePosted, posterId, posterName, posterProfileAvatar, posterPhoneNumber)\
        VALUES ('"+ name +"','"+ isPending +"','"+ views +"','"+price+"','" +description+"','"+category+"','"+req.files.path[0]+"','"+datePosted+"','"+posterId+"','"+posterName+"','"+posterProfileAvatar+"','"+posterPhoneNumber+"')"
        ,(error, rows, fields)=>{
            if(error) console.log(error);
            else{
                insertedProductId = rows.insertId;
                let images = [];
                try {
                    for(let u = 0; u < req.files.path.length; u++){
                        images.push(req.files.path[u]);
                    }
                } catch (error) {
                    console.log(`cannot parse because: ${error.message}`);
                }
                console.log(`found ${images.length} images`);
                mysqlConnection.query("INSERT INTO images (id, url) VALUES ?", [images.map(image => [insertedProductId, image])] , (err, rows, fields) => {
                    if (err) throw err;
                    else{
                        insertedProductImageId = rows.insertId;
                        res.status(201).json({insertedProductId});
                    }         
                });
            }
        });
    } catch (error) {
        console.log(error);
        res.status(400).json({error});
    }
});

//for getting all products that are not pending
router.get('/products', requireAuth, async (req,res)=> {
    console.log('get products called');
    const pendingString = 'false';
    const { size } = req.query;
    const page = req.query.page ? Number(req.query.page) : 1;
    mysqlConnection.query("SELECT * FROM products WHERE isPending = ?", [pendingString] ,(error, rows, fields)=>{
        const resLength = rows.length;
        console.log(`products found: ${resLength}`);
        const totalPages = Math.ceil(resLength / size);        
        if(error) console.log(error);
        if(page > totalPages) res.redirect('/products?page='+ encodeURIComponent(totalPages) + '&size='+ encodeURIComponent(size));
        else if(page < 1)  res.redirect('/products?page='+ encodeURIComponent('1') + '&size='+ encodeURIComponent(size));
        const startPoint = (page - 1) * size;
        mysqlConnection.query(`SELECT * FROM products WHERE isPending = ? ORDER BY id DESC LIMIT ${startPoint},${size}`, [pendingString] ,(error, rows, fields)=>{
            if(error) console.log(error);
            let iterator = (page - 5) < 1 ? 1 : page - 5;
            let endPoint = (iterator + 9) <= totalPages ? (iterator + 9) : page + (totalPages - page);
            if(endPoint < (page + 4)){
                iterator -= (page + 4) - totalPages;
            }
            res.json({rows, totalPages});
        });
    });
});

//for getting all products
router.get('/products/pending', requireAuth, async (req,res)=> {
    console.log('get products called');
    const pendingString = 'true';
    const { size } = req.query;
    const page = req.query.page ? Number(req.query.page) : 1;
    mysqlConnection.query("SELECT * FROM products WHERE isPending = ?", [pendingString] ,(error, rows, fields)=>{
        const resLength = rows.length;
        console.log(`products found: ${resLength}`);
        const totalPages = Math.ceil(resLength / size);        
        if(error) console.log(error);
        if(page > totalPages) res.redirect('/products?page='+ encodeURIComponent(totalPages) + '&size='+ encodeURIComponent(size));
        else if(page < 1)  res.redirect('/products?page='+ encodeURIComponent('1') + '&size='+ encodeURIComponent(size));
        const startPoint = (page - 1) * size;
        mysqlConnection.query(`SELECT * FROM products WHERE isPending = ? ORDER BY id DESC LIMIT ${startPoint},${size}`, [pendingString] ,(error, rows, fields)=>{
            if(error) console.log(error);
            let iterator = (page - 5) < 1 ? 1 : page - 5;
            let endPoint = (iterator + 9) <= totalPages ? (iterator + 9) : page + (totalPages - page);
            if(endPoint < (page + 4)){
                iterator -= (page + 4) - totalPages;
            }
            res.json({rows, totalPages});
        });
    });
});

//get specific product by its id
router.get('/product',(req,res)=>{
    const { id } = req.query;
    mysqlConnection.query('SELECT * FROM products WHERE id = ?', [id], (error, rows, fields)=>{
        if(error) console.log(error);
        else res.json(rows[0]);
    });
});

//update product by its id
router.patch('/product',(req,res)=>{
    const { id } = req.query;
    const isPendingString = 'false';
    mysqlConnection.query('UPDATE products SET isPending = ? WHERE id = ?', [ isPendingString, id ], (error, rows, fields)=>{
        if(error) console.log(error);
        else res.status(200).json({message: "updated successfully"});
    });
});



//delete product by its id
router.delete('/product',(req,res)=>{
    const { id } = req.query;
    mysqlConnection.query('SELECT * FROM images WHERE id = ?', [id], (error, rows, fields)=>{
        if(error) console.log(error);
        else {
            for(let v = 0; v < rows.length; v++){
                try {
                    const filePath = rows[v]['url'];
                    fs.unlink(filePath, ()=>{console.log(`${filePath} has been removed from server.`)});
                } catch (error) {   
                    console.log(error.message);
                }
            }
        }
    });
    mysqlConnection.query('DELETE FROM images WHERE id = ?', [id], (error, rows, fields)=>{
        if(error) console.log(error);
        else {
            mysqlConnection.query('DELETE FROM products WHERE id = ?', [id], (error, rows, fields)=>{
                if(error) console.log(error);
                else res.status(200).json({message: 'Deleted Successfully'});
            });
        }
    });
});


module.exports = router;