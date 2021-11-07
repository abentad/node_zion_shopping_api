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

module.exports = router;
