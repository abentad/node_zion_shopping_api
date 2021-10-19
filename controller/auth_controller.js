const User = require('../models/User');
const jwt = require('jsonwebtoken'); 

//handle errors
const handleError = (error) => {
    console.log(error.message, error.code);
    let compiledError = { username: '', email: '', password: '' };
    //incorrect email
    if(error.message === 'incorrect email'){
        compiledError['email'] = 'Email is not registered.';
    }
    //incorrect password
    if(error.message === 'incorrect password'){
        compiledError['password'] = 'Password is incorrect.';
    }
    //duplicate errors
    if(error.code === 11000){
        compiledError['email'] = 'Email is already registered.';
        return compiledError;
    }
    //validation errors
    if(error.message.includes('user validation failed')){
        Object.values(error.errors).forEach(({properties}) => {
            compiledError[properties.path] = properties.message;
        });
    }
    return compiledError;
}

//creates a token using the users id it is set to 365 days
const maxAge = 365 * 24 * 60 * 60;
const createToken = (id) => {
    return jwt.sign({ id }, 'key to hash the jwt with', {expiresIn: maxAge});
}


module.exports = {
    signup: async (req,res)=>{
        console.log('sign up called'); 
        const { username, email, password, phoneNumber } = req.body;
        try {
            //will create a user object using the model "User" and stores it to mongodb and also stores it into variable 'user' locally after storing to db
            const user = await User.create({ username, email, password, phoneNumber, profile_image: req.file.path, dateJoined: Date.now() });
            const token = createToken(user.id);
            const responseData = {userId: user.id, username: user.username, email: user.email, profile: user.profile_image, phoneNumber: user.phoneNumber, dateJoined: user.dateJoined, token: token };
            res.status(201).json( responseData );
        } catch (error) {
            const errors =  handleError(error);
            res.status(400).json({ errors });
        }
    },
    signin: async(req,res)=>{
        console.log('sign in called'); 
        const { email, password } = req.body;
        try {
            const user = await User.signin(email, password);
            const token = createToken(user.id);
            const responseData = {userId: user.id, username: user.username, email: user.email, profile: user.profile_image, phoneNumber: user.phoneNumber, dateJoined: user.dateJoined, token: token };
            res.status(200).json( responseData );
        } catch (error) {
            const errors = handleError(error);
            res.status(400).json({ errors });
        }
    },
    signinwithtoken: async(req,res)=>{
        try {
            const user = await User.findById(req.userId);
            const responseData = {userId: user.id, username: user.username, email: user.email, profile: user.profile_image, phoneNumber: user.phoneNumber, dateJoined: user.dateJoined };
            res.status(200).json(responseData);
        } catch (error) {
            console.log(error);
            res.status(400).json({ error });
        }
        
    }
}