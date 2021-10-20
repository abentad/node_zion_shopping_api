const { requireAuth } = require('../middleware/auth_middleware');

const router = require('express').Router();
const upload = require('../utils/multer');
const sharp = require('sharp');
const Product = require('../models/Product');

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

 
router.post('/post', requireAuth, uploadProductImages, modifyProductImage, async (req,res)=>{
    console.log('product post called');
    const { name, description, category, price, posterId, posterName, posterPhoneNumber, posterProfileAvatar } = req.body;
    console.log('files', req.files);
    try {
        const product = await Product.create({posterId, posterName, posterPhoneNumber, posterProfileAvatar, name, description, category, price, datePosted: Date.now(), productImages: req.files.path});
        const responseData = {name: product.name };
        res.status(201).json( responseData );
    } catch (error) {
        console.log(error);
        res.status(400).json({error});
    }
});

router.get('/products', requireAuth, paginatedResults(Product), async (req,res)=> {
    console.log('get products called');
    const result = res.paginatedResults;
    res.status(200).json( result );
});

function  paginatedResults(model){
    return async (req,res,next)=>{
        const page = parseInt(req.query.page);
        const limit = parseInt(req.query.limit);
    
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit; 
        
        const results = {};

        if(endIndex < await model.countDocuments().exec()){
            results.next = {
                page: page + 1,
                limit: limit
            }
        }
       
        if(startIndex > 0){
            results.previous = {
                page: page - 1,
                limit: limit
            }
        }
        try {  
            const dataResults = await model.find().limit(limit).skip(startIndex).exec(); 
            results.results = dataResults.reverse();
            res.paginatedResults = results;
            next();
        } catch (error) {
            res.status(500).json({error: error.message});
        }
        
    }
}


module.exports = router;