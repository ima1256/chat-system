const express = require("express");
const fileUpload = require('express-fileupload');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const app = express();
const http = require('http');
const path = require('path');

//Constants
const port = process.env.PORT;
const hostname = process.env.HOST;
const messageManager = require('./managers/message');
const userManager = require('./managers/user');
const serverManager = require('./managers/server');

//Middleweres
app.use('/uploads', express.static(path.join(__dirname + '/uploads')));
app.use(express.static(path.join(__dirname + '/public')));
app.use(cors());
app.use(bodyParser.json());
//app.user(filter()) //Para ataques no-sql
app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileUpload({createParentPath: true}));  // enable files upload

//Connection points

//User
app.get('/user/:id', userManager.getUser);
app.post('/user', userManager.createUser);
app.put('/user/:id', userManager.updateUser);
app.delete('/user/:id', userManager.deleteUser);

//Server
app.get('/server/:id', serverManager.getServer);
app.post('/server', serverManager.createServer);
app.put('/server/:id', serverManager.updateServer);
app.delete('/server/:id', serverManager.deleteServer);

//Message
app.get('/message/:id', messageManager.getMessage);
app.post('/message', messageManager.createMessage);
app.put('/message/:id', messageManager.updateMessage);
app.delete('/message/:id', messageManager.deleteMessage);


//Sockets para mensajes de chat
const server = http.createServer(app);
const io = require('socket.io')(server);

io.on('connection', socket => {
    console.log('Some client connected');

    socket.on('chat', message => {
        console.log('From client: ', message);
        io.emit('chat', message);
    })
})

server.listen(port, () => {
    console.log(`Servidor corriendo en puerto ${port} y host ${hostname}`);
})