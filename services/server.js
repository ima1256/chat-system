const Server = require('../models/server');

const User = require('../models/user');
const _ = require('lodash');
const Server = require('../models/server');
const Channel = require('../models/channel');
const {saveFile, existFile} = require('../utils/files');

async function getServer(id) {
    let server = await Server.findById(id);
    if (!server) throw {errors: {serverNotFound: 'No se ha encontrado el servidor'}}
    return server;
}

async function createServer(srv) {

    let server = {...srv};

    //Buscar el usuario creador y comprobar si existe
    let creator = await User.findById(server.creator).exec();
    if (!creator) throw {errors: {mainUserNotFound: 'El usuario no existe'}}
    server._id = creator._id;

    //Crear un canal de texto, por defecto los canales son de texto
    let defaultTextChannel = new Channel({name: 'canal de texto', server: server._id});
    server.textChannels = [defaultTextChannel];

    //Instanciar el servidor
    server = new Server(server);
    
    //Añadir al creador como moderador y como miembro del servidor
    //Esto se hace automaticamente en el esquema mongoose

    await server.save();
    await defaultTextChannel.save();
}

module.exports = {
    getServer,
    createServer,
    updateServer,
    deleteServer,
    addMemberServer,
    removeMemberServer,
    addModeratorServer,
    removeModeratorServer,
    addTextChannel,
    removeTextChannel
}