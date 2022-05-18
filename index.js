const express = require("express");
const fileUpload = require('express-fileupload');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const app = express();
const http = require('http');
const _ = require('lodash');

const db = require('./db/db');

const port = process.env.PORT || 3000;
const hostname = process.env.HOST || 'localhost';

const path = require('path');
// enable files upload
app.use(fileUpload({
    createParentPath: true
}));

//add other middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname + '/public')));
app.use(express.static(path.join(__dirname + '/uploads')));

app.get('/', (req, res) => {
    res.send('Bienvenido a la web');
});

function saveFile(file, data) {

    //Here we give a unique id with its extension to the file saved in uploads dir
    let savedFileName = getUniqueId() + path.extname(file.name);

    //move photo to uploads directory
    file.mv('./uploads/' + savedFileName);

    //push file details
    data.push({
        originalName: file.name,
        savedName: savedFileName,
        mimetype: file.mimetype,
        size: file.size
    });
}

function getUniqueId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

const mongoose = require('mongoose');

//Devolvemos los ultimos mensajes de un servidor
//En esta ruta nos mandan por el body el 
//*id del servidor - server
//*cuantos mensajes se quieren cargar - numMessages
app.get('/uploads', async (req,res) => {
    let messages = await db.getMessages(req.body.server, req.body.numMessages);

    let response = {
        status: true,
        message: 'Your messages are getted',
        data: []
    }

    for(let key in Object.keys(messages)) {
        let message = messages[key];
        response.data.push({
            text: message.text,
            files: message.files,
            user: 'Imanol Conde',
            date: message._id.getTimestamp()
        });
    }

    //Procesamos lo que nos devuelve el servidor para mostrarlo bonito al frontend
    res.send(response);
})

app.post('/uploads', async (req, res) => {

    let dbMessage = {};

    //console.log(req.body);

    try {

        await mongoose.connect('mongodb://localhost:27017/chat-system');

        //Guardamos cuando el mensaje no tiene ficheros
        if (!req.files) {

            await db.saveMessage({ text: req.body.text, files: [] });

            res.send({
                status: true,
                message: 'Your message is saved without files'
            });

        } else {
            let data = [];

            //Cuando el mensaje tiene un unico fichero
            if (req.files.files.constructor !== Array) saveFile(req.files.files, data);
            //Cuando el mensaje tiene multiples ficheros
            else {
                //loop all files
                _.forEach(_.keysIn(req.files.files), (key) => {
                    let file = req.files.files[key];
                    console.log('This file: ', file);
                    saveFile(file, data);
                });
            }

            await db.saveMessage({ text: req.body.text, files: data });

            //return response
            res.send({
                status: true,
                message: 'Message with files saved in db',
                data: data
            });
        }

    } catch (err) {
        console.log(err);
        res.status(500).send(err);
    }

});


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