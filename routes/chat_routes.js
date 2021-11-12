const { requireAuth } = require('../middleware/auth_middleware');
const mysqlConnection = require('../utils/database');
const { fields } = require('../utils/multer');

const router = require('express').Router();

//for FCM notifications
var admin = require("firebase-admin");
var serviceAccount = require("../notification/serviceAccountKey.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

//check if there is a conversation between sender and receiver id
router.get('/conv/check', requireAuth, async (req,res)=>{
    const { sId, rId } = req.query;
    try {
        mysqlConnection.query('SELECT * FROM conversations WHERE senderId = ? AND receiverId = ? OR receiverId = ? AND senderId = ?', [sId, rId, sId, rId], (error, rows, fields)=>{
            if(error){
                res.status(500).json({message: "something went wrong"});
                console.log(error);
            }else{
                if(rows[0]){
                    res.status(200).json(rows[0]);
                }else{
                    res.status(500).json({message: "no conv found."});
                }
            }
        });
    } catch (error) {
        res.status(500).json(error);
    }
});



//get conversation of a user by user id
router.get('/conv', requireAuth, async (req,res)=>{
    const { id } = req.query;
    try {
        mysqlConnection.query('SELECT * FROM conversations WHERE senderId = ? OR receiverId = ?', [id, id], (error, rows, fields)=>{
            if(error){
                res.status(500).json({message: "something went wrong"});
                console.log(error);
            }else{
                res.status(200).json(rows);
            }
        });
    } catch (error) {
        res.status(500).json(error);
    }
});

//add new conversation of a user
router.post('/conv', requireAuth, async (req,res)=>{
    const { senderId, receiverId, senderName, receiverName, senderProfileUrl, receiverProfileUrl, lastMessage, lastMessageTimeSent, lastMessageSenderId } = req.body;
    try {
        mysqlConnection.query("INSERT INTO conversations(senderId, receiverId, senderName, receiverName, senderProfileUrl, receiverProfileUrl, lastMessage, lastMessageTimeSent, lastMessageSenderId)\
         values('"+ senderId +"','"+ receiverId +"','"+ senderName +"','"+receiverName+"','" +senderProfileUrl+"','"+ receiverProfileUrl +"','"+ lastMessage +"','"+lastMessageTimeSent+"','" +lastMessageSenderId+"')", (error, rows, fields)=>{
            if(error){
                res.status(500).json({message: "something went wrong when creating new conversation"});
                console.log(error);
            }else{
                try {
                    mysqlConnection.query('SELECT * FROM conversations WHERE id = ?', [rows.insertId], (error, rows, fields)=>{
                        if(error){
                            res.status(500).json({message: "something went wrong when finding the conversation by id"});
                            console.log(error);
                        }else{
                            res.status(200).json(rows[0]);
                        }
                    });
                } catch (error) {
                    res.status(500).json(error);
                }    
            }
        });
    } catch (error) {
        res.status(500).json(error);
    }
});

//get messages of a user by conversationid
router.get('/message', requireAuth, async (req,res)=>{
    const { convId } = req.query;
    try {
        mysqlConnection.query('SELECT * FROM messages WHERE conversationId = ?', [convId], (error, rows, fields)=>{
            if(error){
                res.status(500).json({message: "something went wrong"});
                console.log(error);
            }else{
                res.status(200).json(rows);
            }
        });
    } catch (error) {
        res.status(500).json(error);
    }
});

//add new message
router.post('/message', requireAuth, async(req,res)=>{
    const { conversationId, senderId, senderName, messageText, timeSent, receiverId} = req.body;
    try {
        mysqlConnection.query("INSERT INTO messages(conversationId, senderId, senderName, messageText, timeSent)\
         VALUES('"+ conversationId +"','"+ senderId +"','"+ senderName +"','"+messageText+"','" +timeSent+"');\
         UPDATE conversations SET lastMessage='"+ messageText +"',lastMessageTimeSent='"+ timeSent +"'\
         ,lastMessageSenderId='"+ senderId +"' WHERE id = ?;\
         SELECT deviceToken FROM users WHERE id = ?",[conversationId, receiverId],(error,rows,fields)=>{
            if(error){
                res.status(500).json({message: "something went wrong"});
                console.log(error);
            }else{
                let results = {};
                if(rows[2][0]['deviceToken'] == undefined){
                    console.log('device token is undefined');
                    results.dvt = "none";
                }else{
                    results.dvt = rows[2][0]['deviceToken'];
                }
                mysqlConnection.query("SELECT * FROM messages WHERE id = ?", [rows[0]['insertId']], (error, rows, fields)=>{
                    if(error){
                        res.status(500).json({message: "something went wrong"});
                        console.log(error);
                    }else{
                        results.msg = rows[0];
                        res.status(201).json(results);
                    }
                });
            }
        });
    } catch (error) {
        res.status(500).json(error);
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

module.exports = router;
