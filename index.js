const express = require("express");
const fileUpload = require('express-fileupload');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const app = express();
const http = require('http');
const _ = require('lodash');

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
app.use(express.static(path.join(__dirname + '/public')))

app.get('/', (req, res) => {
    res.send('Bienvenido a la web');
});

function saveFile(file, data) {
    //move photo to uploads directory
    file.mv('./uploads/' + file.name);

    //push file details
    data.push({
        name: file.name,
        mimetype: file.mimetype,
        size: file.size
    });
}

app.post('/uploads', async (req, res) => {

    console.log('Upload');

    try {
        if (!req.files) {
            res.send({
                status: false,
                message: 'No file uploaded'
            });
        } else {
            let data = [];

            if (req.files.files.constructor !== Array) saveFile(req.files.files, data);
            else {
                //loop all files
                _.forEach(_.keysIn(req.files.files), (key) => {
                    let file = req.files.files[key];

                    saveFile(file, data);
                });
            }
            //return response
            res.send({
                status: true,
                message: 'Files are uploaded',
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