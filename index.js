const express = require('express');
const authRoute = require('./routes/auth_routes');
const dataRoute = require('./routes/data_routes');
const imageRoute = require('./routes/image_route');
const app = express();

//middlewares
app.use(express.json({extended: false}));
app.use('/user', authRoute);
app.use('/data', dataRoute);
app.use('/image', imageRoute);


//api root
app.get('/',(req,res)=>{
    res.status(200).json({message: "go to /user or /data"});
})

//static folders
app.use('/uploads/profiles', express.static('uploads/profiles'));
app.use('/uploads/products', express.static('uploads/products'));

//connecting to mongodb and starting serve

//for local
const port = process.env.PORT || 3000;
app.listen(port, ()=> console.log(`Server started at http://localhost:${port}`));

//for public
// app.listen();

