const jwt = require('jsonwebtoken'); 
const mysqlConnection = require('../utils/database');
const bcrypt = require('bcrypt');

//creates a token using the users id it is set to 365 days
const maxAge = 365 * 24 * 60 * 60;
const createToken = (id) => {
    return jwt.sign({ id }, 'key to hash the jwt with', {expiresIn: maxAge});
}


module.exports = {
    signup: async (req,res)=>{
        console.log('sign up called'); 
        let { username, email, password, phoneNumber, dateJoined } = req.body;
        try {
            //will create a user object using the model "User" and stores it to mongodb and also stores it into variable 'user' locally after storing to db
            // const user = await User.create({ username, email, password, phoneNumber, profile_image: req.file.path, dateJoined });
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
            // throw console.error(error);
        }
    },
    //TODO: IT works but fix this: ---- "Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client"
    signin: (req,res)=>{
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
            // const errors = handleError(error);
            res.status(400).json({ error });
        }
    },
    signinwithtoken: async(req,res)=>{
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
        
    },
    updateUserInfo: (req,res)=>{
        const { id, username, email, phoneNumber, password, profile_image, dateJoined} = req.body;
        mysqlConnection.query("UPDATE users SET username='"+ username +"',email='"+ email +"',phoneNumber='"+ phoneNumber +"',password='"+ password +"',profile_image='"+ profile_image +"'\
        ,dateJoined='"+ dateJoined +"' WHERE id = ?",[id]
        ,(error, rows, fields)=>{
            if(error) console.log(error);
            else res.json('Updated successfully');
        });
    }
}

