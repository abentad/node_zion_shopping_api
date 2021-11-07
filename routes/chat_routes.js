const { requireAuth } = require('../middleware/auth_middleware');
const mysqlConnection = require('../utils/database');
const { fields } = require('../utils/multer');

const router = require('express').Router();

//get conversation of a user
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
