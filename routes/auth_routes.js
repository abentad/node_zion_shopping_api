const router = require('express').Router();
const { requireAuth } = require('../middleware/auth_middleware');
const path = require('path');
const sharp = require('sharp');
const upload = require('../utils/multer');
const jwt = require('jsonwebtoken'); 
const mysqlConnection = require('../utils/database');
const bcrypt = require('bcrypt');

//for FCM notifications
var admin = require("firebase-admin");
var serviceAccount = require("../notification/serviceAccountKey.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

//creates a token using the users id it is set to 365 days
const maxAge = 365 * 24 * 60 * 60;
const createToken = (id) => {
    return jwt.sign({ id }, 'key to hash the jwt with', {expiresIn: maxAge});
}


//sharp
//will create a file name for the modified file and stores it in the uploads folder
//will grab the image buffers from multer then resizes it then converts it to jpeg format with quality 50% 
//then it will use the filename created above to save the output
//then sets the req.file.path to be the newly modified files' path to be passed to the next function so it can be accessed using req.file.path
const modifyProfileImage =  async (req, res, next) => {
    try {
        const fileName = 'uploads/profiles/' + 'profile_' + Date.now() +  getRandomInt(100) + getRandomInt(100) + '.jpg';
        await sharp(req.file.buffer).resize(120,120).jpeg({ quality: 60 }).toFile(fileName);
        req.file.path = fileName;
    } catch (error) {
        console.log(error);
    }
    next();
}

//
router.post('/signup', upload.single('profile') , modifyProfileImage, async (req,res)=>{
    console.log('sign up called'); 
    let { username, email, password, phoneNumber, dateJoined, deviceToken } = req.body;
    try {
        const salt = await bcrypt.genSalt();
        password = await bcrypt.hash(password, salt);
        mysqlConnection.query("INSERT INTO users(deviceToken, username, email, phoneNumber, password, profile_image, dateJoined)\
        VALUES ('"+ deviceToken +"','"+ username +"','"+email+"','" +phoneNumber+"','"+password+"','"+req.file.path+"','"+dateJoined+"')"
        ,(error, rows, fields)=>{
            if(error){
                res.status(500).json({message: "something went wrong"});
                console.log(error);
            }
            else{
                const token = createToken(rows.insertId);
                const responseData = {userId: rows.insertId, username, email, profile: req.file.path, phoneNumber, dateJoined, token, deviceToken };
                res.status(201).json( responseData );
            }
        });
    } catch (error) {
        res.status(500).json({message: "something went wrong"});
        console.log(error);
    }
});

//
router.post('/signin', (req,res)=>{
    console.log('sign in called'); 
    const { email, password, deviceToken } = req.body;
    try {
        mysqlConnection.query('SELECT * FROM users WHERE email = ?', [email],async (error, rows, fields)=>{
            if(error) {
                res.status(500).json({message: "something went wrong"});
                console.log(error);
            }
            else {
                const user = rows[0];
                if(user){
                    const auth = await bcrypt.compare(password, user['password']).catch(e=>console.log(e.message));
                    if(auth){
                        const token = createToken(user['id']);
                        mysqlConnection.query("UPDATE users SET deviceToken='"+ deviceToken +"' WHERE id = ?",[rows[0]['id']],(error, rows, fields)=>{
                            if(error) {
                                res.status(500).json({message: "something went wrong"});
                                console.log(error);
                            }
                        });
                        const responseData = {userId: user.id, username: user.username, email: user.email, profile: user.profile_image, phoneNumber: user.phoneNumber, dateJoined: user.dateJoined, token: token, deviceToken: deviceToken };
                        res.status(200).json( responseData );
                    }
                    res.status(400).json({message: "Incorrect password"});
                }else if(rows == []){
                    res.status(400).json({message: "Incorrect email"});
                }
                else{
                    res.status(400).json({message: "Incorrect email"});
                }
            }
        });

    } catch (error) {
        res.status(500).json({message: "something went wrong"});
        console.log(error);
    }
});
router.get('/signinwithtoken', requireAuth, async(req,res)=>{
    try {
        mysqlConnection.query('SELECT * FROM users WHERE id = ?', [req.userId], (error, rows, fields)=>{
            if(error) {
                res.status(500).json({message: "something went wrong"});
                console.log(error);
            }
            else {
                const user = rows[0];
                const responseData = {userId: user['id'], username: user['username'], email: user['email'], profile: user['profile_image'], phoneNumber: user['phoneNumber'], dateJoined: user['dateJoined'] };
                res.status(200).json(responseData);
            }
        });
    } catch (error) {
        res.status(500).json({message: "something went wrong"});
        console.log(error);
    }
});

router.get('/getDeviceToken', requireAuth, async(req,res)=>{
    const { userId } = req.query;
    try {
        mysqlConnection.query('SELECT deviceToken FROM users WHERE id = ?', [userId], (error, rows, fields)=>{
            if(error) {
                res.status(500).json({message: "something went wrong"});
                console.log(error);
            }
            else {
                if(rows[0] == undefined){
                    res.status(201).json({message: "no device token"});
                }else{
                    res.status(200).json(rows[0]);  
                }
            }
        });
    } catch (error) {
        res.status(500).json({message: "something went wrong"});
        console.log(error);
    }
});

router.get('/sendNotification', requireAuth, async(req,res)=>{
    const { deviceToken, messageTitle, messageBody } = req.query;

    admin.messaging().send({
        token: deviceToken,
        notification: {
            title: messageTitle,
            body: messageBody
        }
    }).then((response)=>{
        res.status(200).json(response);
    }).catch((error)=> console.log(error));
});


router.put('/update', (req,res)=>{
    const { id, username, email, phoneNumber, password, profile_image, dateJoined} = req.body;
    try {
        mysqlConnection.query("UPDATE users SET username='"+ username +"',email='"+ email +"',phoneNumber='"+ phoneNumber +"',password='"+ password +"',profile_image='"+ profile_image +"'\
        ,dateJoined='"+ dateJoined +"' WHERE id = ?",[id]
        ,(error, rows, fields)=>{
            if(error) {
                res.status(500).json({message: "something went wrong"});
                console.log(error);
            }
            else res.status(200).json('Updated successfully');
        });
    } catch (error) {
        res.status(500).json({message: "something went wrong"});
        console.log(error);
    }
});


router.get('/seller', requireAuth, (req,res)=>{
    const { id } = req.query;
    const isPendingString = "false";
    try {
        mysqlConnection.query("SELECT * FROM users WHERE id = ?", [id], (error, rows, fields)=>{
            if(error){
                res.status(500).json({message: "something went wrong"});
                console.log(error);
            }else{
                const user = rows[0];
                let sellerProducts;
                const responseData = {userId: user['id'], username: user['username'], email: user['email'], profile: user['profile_image'], phoneNumber: user['phoneNumber'], dateJoined: user['dateJoined'] };
                mysqlConnection.query("SELECT * FROM products WHERE posterId = ? AND isPending = ?", [id, isPendingString], (error, rows, fields)=>{
                    if(error){
                        res.status(500).json({message: "something went wrong"});
                        console.log(error);
                    }else{
                        sellerProducts = rows;
                        res.status(200).json({responseData, sellerProducts});
                    }
                });  
            }
        });
    } catch (error) {
        res.status(500).json({message: "something went wrong"});
        console.log(error);
    }

});

router.get('/signout', requireAuth, (req,res)=>{
    const { id } = req.query;
    const deviceToken = "";
    mysqlConnection.query("UPDATE users SET deviceToken='"+ deviceToken +"' WHERE id = ?",[id],(error, rows, fields)=>{
        if(error) {
            res.status(500).json({message: "something went wrong"});
            console.log(error);
        }else{
            res.status(200).json({message: "remove successfully"});
        }
    });
});


module.exports = router;
