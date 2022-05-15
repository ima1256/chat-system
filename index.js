const express = require("express");
require('dotenv').config();

const app = express();
const http = require('http');

const server = http.createServer(app);
const io = require('socket.io')(server);

io.on('connection', socket => {
    console.log('Some client connected');

    socket.on('chat', message => {
        console.log('From client: ', message);
        console.log('With socket: ', socket);
        io.emit('chat', message);
    })
})

const port = process.env.PORT || 3000;
const hostname = process.env.HOST || 'localhost';

const path = require('path')
app.use(express.static(path.join(__dirname + '/public')))

app.get('/', (req, res) => {
    res.send('Bienvenido a la web');
});

server.listen(port, hostname, () => {
    console.log(`Servidor corriendo en puerto ${port} y host ${hostname}`);
})