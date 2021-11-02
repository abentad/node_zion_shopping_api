const router = require('express').Router();
const mysqlConnection = require('../utils/database');
const fs = require('fs');

//get product images by product id
router.get('/',(req,res)=>{
    const { id } = req.query;
    mysqlConnection.query('SELECT * FROM images WHERE id = ?', [id], (error, rows, fields)=>{
        if(error) console.log(error);
        else {
            //for updating views when product images are viewed
            mysqlConnection.query('SELECT views FROM products WHERE id = ?', [id], (error, rows, fields)=>{
                if(error) console.log(error);
                else {
                    const oldView = rows[0]['views'];
                    const updatedView = oldView + 1;
                    mysqlConnection.query('UPDATE products SET views = ? WHERE id = ?', [ updatedView, id ], (error, rows, fields)=>{
                        if(error) console.log(error);
                    });
                }
            });
            res.status(200).json(rows);
        }
    });
});

//delete product images by product id
router.delete('/',(req,res)=>{
    const { id } = req.query;
    mysqlConnection.query('SELECT * FROM images WHERE image_id = ?', [id], (error, rows, fields)=>{
        if(error) console.log(error);
        else {
            try {
                const filePath = rows[0]['url'];
                fs.unlink(filePath, ()=>{console.log(`${filePath} has been removed from server.`)});
            } catch (error) {   
                console.log(error.message);
            }
        }
    });
    mysqlConnection.query('DELETE FROM images WHERE image_id = ?', [id], (error, rows, fields)=>{
        if(error) console.log(error);
        else res.status(200).json({message: 'Deleted Successfully'});
    });
});

module.exports = router;