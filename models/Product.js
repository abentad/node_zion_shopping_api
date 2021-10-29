const mongoose = require('mongoose');
const productSchema = new mongoose.Schema({
    posterId: {
        type: String,
        required: [true, 'poster id required']
    },
    posterName:{
        type: String,
        required: [true, 'poster name required'],
        lowercase: true
    },
    posterProfileAvatar:{
        type: String,
        required: [true, 'Please provide a poster profile avatar']
    },
    posterPhoneNumber:{
        type: String,
        required: [true, 'please provide a phone number']
    },
    name: {
        type: String,
        required: [true, 'Please enter product name'],
        lowercase: true
    },
    description: {
        type: String,
        required: [true, 'Pleasae enter product description'],
        lowercase: true
    },
    category: {
        type: String,
        required: [true, 'Please enter product category'],
        lowercase: true
    },
    price: {
        type: String,
        required: [true, 'Please enter product price']
    },
    datePosted: {
        type: String,
        required: true
    },
    productImages: [
        { type: String }
    ],
    
}) 

const Product = mongoose.model('product', productSchema); 

module.exports = Product; 