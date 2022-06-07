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
const messageManager = require('./controllers/message');
const userController = require('./controllers/user');
const serverManager = require('./controllers/server');

//Middleweres
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname + '/uploads')));
app.use(express.static(path.join(__dirname + '/public')));
app.use(bodyParser.json());
//app.user(filter()) //Para ataques no-sql
app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileUpload({ createParentPath: true }));  // enable files upload

//Connection points

//User
app.get('/user/:id', userController.getUser);
app.post('/user', userController.createUser);
app.put('/user/:id', userController.updateUser);
app.delete('/user/:id', userController.deleteUser);

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

const db = require('./services/db');

server.listen(port, async () => {

    //Recuerda que siempre nos tenemos que conectar a la base de datos en 
    //este punto de la aplicación no una vez por operación
    try {
        await db.connect();
        console.log(`Servidor corriendo en puerto ${port} y host ${hostname}`);
    } catch(err) {
        console.log(err);
        await db.closeDatabase();
    }

})