const express = require('express');
const mongoose = require('mongoose');
const authRoute = require('./routes/auth_routes');
const dataRoute = require('./routes/data_routes');
const app = express();

//middlewares
app.use(express.json({extended: false}));
app.use('/user', authRoute);
app.use('/data', dataRoute);
//
app.get('/',(req,res)=>{
    res.status(200).json({message: "go to /user or /data"});
})
//
app.use('/uploads/profiles', express.static('uploads/profiles'));
app.use('/uploads/products', express.static('uploads/products'));



//connecting to mongodb and starting serve
const port = process.env.PORT || 3000;
const mongooseUrl = "mongodb+srv://abeni:19875321ab@liyucluster.dqtyi.mongodb.net/auth?retryWrites=true&w=majority";
// app.listen(port,()=> console.log('server started.'));
mongoose.connect(mongooseUrl).then(()=> app.listen(port, ()=> console.log('Db connected\nServer started at http://localhost:' + port))).catch((e)=> console.log(e));
