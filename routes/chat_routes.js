const { requireAuth } = require('../middleware/auth_middleware');
const mysqlConnection = require('../utils/database');
const { fields } = require('../utils/multer');

const router = require('express').Router();

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

//updates last message in conversation
router.put('/conv/updlmsg', (req,res)=>{
    const { convId, lastMessage,lastMessageTimeSent, lastMessageSenderId } = req.body;
    try {
        mysqlConnection.query("UPDATE conversations SET lastMessage='"+ lastMessage +"',lastMessageTimeSent='"+ lastMessageTimeSent +"',lastMessageSenderId='"+ lastMessageSenderId +"' WHERE id = ?",[convId]
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
                res.status(500).json({message: "something went wrong"});
                console.log(error);
            }else{
                res.status(201).json(rows.insertId);
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
    const { conversationId, senderId, senderName, messageText, timeSent} = req.body;
    try {
        mysqlConnection.query("INSERT INTO messages(conversationId, senderId, senderName, messageText, timeSent)\
         VALUES('"+ conversationId +"','"+ senderId +"','"+ senderName +"','"+messageText+"','" +timeSent+"')",(error,rows,fields)=>{
            if(error){
                res.status(500).json({message: "something went wrong"});
                console.log(error);
            }else{
                mysqlConnection.query("SELECT * FROM messages WHERE id = ?", [rows['insertId']], (error, rows, fields)=>{
                    if(error){
                        res.status(500).json({message: "something went wrong"});
                        console.log(error);
                    }else{
                        res.status(201).json(rows[0]);
                    }
                });
            }
        });
    } catch (error) {
        res.status(500).json(error);
    }
});

module.exports = router;
