const express = require('express');
const authRoute = require('./routes/auth_routes');
const dataRoute = require('./routes/data_routes');
const imageRoute = require('./routes/image_route');
const chatRoute = require('./routes/chat_routes');
const app = express();
const server = require('http').createServer(app);
//socket io
const io = require('socket.io')(server, { cors: { origin: "*" } });

//middlewares
app.use(express.json({extended: false}));
app.use('/user', authRoute);
app.use('/data', dataRoute);
app.use('/image', imageRoute);
app.use('/chat', chatRoute);


//socket connections 
io.on('connection', socket => {
    // console.log('client connect...', socket.id);
  
    //for sending message to all users
    socket.on('send-message', (message) => {
      io.emit('receive-message', message);  
    });
    
    //for joining a room
    socket.on('join-room', (roomName)=> {
      socket.join(roomName);
      // console.log(`${socket.id} joined ${roomName}`);
    });
  
    //for sending message to who are inside the given room users
    socket.on('send-message-to-room', (data) => {
      socket.to(data['roomName']).emit('receive-message-from-room', data['message']);
    });
  
    //for when user disconnects
    socket.on('disconnect', () => {
      // console.log('client disconnect...', socket.id);
    });
  
    //for when error occurs
    socket.on('error', (err) => { 
      console.log('received error from client:', socket.id);
      console.log(err);
    });
  });

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
server.listen(port, ()=> console.log(`Server started at http://localhost:${port}`));

//for public
// server.listen();

