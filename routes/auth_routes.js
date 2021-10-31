const router = require('express').Router();
const { requireAuth } = require('../middleware/auth_middleware');
const path = require('path');
const sharp = require('sharp');
const upload = require('../utils/multer');
const jwt = require('jsonwebtoken'); 
const mysqlConnection = require('../utils/database');
const bcrypt = require('bcrypt');

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
    let { username, email, password, phoneNumber, dateJoined } = req.body;
    try {
        const salt = await bcrypt.genSalt();
        password = await bcrypt.hash(password, salt);
        mysqlConnection.query("INSERT INTO users(username, email, phoneNumber, password, profile_image, dateJoined)\
        VALUES ('"+ username +"','"+email+"','" +phoneNumber+"','"+password+"','"+req.file.path+"','"+dateJoined+"')"
        ,(error, rows, fields)=>{
            if(error)   console.log(error);
            else{
                const token = createToken(rows.insertId);
                const responseData = {userId: rows.insertId, username, email, profile: req.file.path, phoneNumber, dateJoined, token };
                res.status(201).json( responseData );
            }
        });
        
    } catch (error) {
        res.status(400).json({ error });
    }
});

//
router.post('/signin', (req,res)=>{
    console.log('sign in called'); 
    const { email, password } = req.body;
    try {
        mysqlConnection.query('SELECT * FROM users WHERE email = ?', [email],async (error, rows, fields)=>{
            if(error) console.log(error);
            else {
                const user = rows[0];
                if(user){
                    const auth = await bcrypt.compare(password, user['password']).catch(e=>console.log(e.message));
                    if(auth){
                        const token = createToken(user['id']);
                        const responseData = {userId: user.id, username: user.username, email: user.email, profile: user.profile_image, phoneNumber: user.phoneNumber, dateJoined: user.dateJoined, token: token };
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
        res.status(400).json({ error });
    }
});
router.get('/signinwithtoken', requireAuth, async(req,res)=>{
    try {
        mysqlConnection.query('SELECT * FROM users WHERE id = ?', [req.userId], (error, rows, fields)=>{
            if(error) console.log(error);
            else {
                const user = rows[0];
                const responseData = {userId: user['id'], username: user['username'], email: user['email'], profile: user['profile_image'], phoneNumber: user['phoneNumber'], dateJoined: user['dateJoined'] };
                res.status(200).json(responseData);
            }
        });
    } catch (error) {
        console.log(error);
        res.status(400).json({ error });
    }
    
});
router.put('/update', (req,res)=>{
    const { id, username, email, phoneNumber, password, profile_image, dateJoined} = req.body;
    mysqlConnection.query("UPDATE users SET username='"+ username +"',email='"+ email +"',phoneNumber='"+ phoneNumber +"',password='"+ password +"',profile_image='"+ profile_image +"'\
    ,dateJoined='"+ dateJoined +"' WHERE id = ?",[id]
    ,(error, rows, fields)=>{
        if(error) console.log(error);
        else res.json('Updated successfully');
    });
});



module.exports = router;
