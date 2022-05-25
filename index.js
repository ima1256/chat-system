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

//Middleweres
app.use('/uploads', express.static(path.join(__dirname + '/uploads')));
app.use(express.static(path.join(__dirname + '/public')));
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileUpload({createParentPath: true}));  // enable files upload

//Connection points
app.get('/uploads', messageManager.getMessages);
app.post('/uploads', messageManager.saveMessage);


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