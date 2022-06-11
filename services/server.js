const Server = require('../models/server');

const User = require('../models/user');
const _ = require('lodash');
const Channel = require('../models/channel');
const { saveFile, existFile, isImage } = require('../utils/files');

function myFindById(id) {
    return Server.findById(id)
    .populate('creator', 'name id')
    .populate('members', 'name id')
    .populate('moderators', 'name id')
    .populate('textChannels', 'name').exec();
}

async function createServer(srv) {

    let server = new Server({ ...srv });

    let creator = await User.findById(server.creator).exec();
    if (!creator) throw { errors: { mainUserNotFound: 'El usuario no existe' } }
    server.creator = creator._id;

    await server.save();
    server = await myFindById(server._id).exec();

    return server.toObject();

}

async function getServer(id) {

    let server = await myFindById(id);

    if (!server) throw {errors: {serverNotFound: 'El servidor no se ha encontrado'}}
    return server.toObject();

}

/*
.populate('creator', 'name id')
    .populate('members', 'name id')
    .populate('moderators', 'name id')
    .populate('textChannels', 'name')
    .populate('commands', 'name').exec();
*/

async function updateServer(srv) {

    let server = await Server.findById(srv.id);

    if (!server) throw {errors: {serverNotFound: 'El servidor no se ha encontrado'}}

    if (srv.operation) {
    
        switch (srv.operation){
            case 'addTextChannel':
                server = await server.addTextChannel(srv.update.name); 
                break;
            case 'removeTextChannel':
                server = await server.removeTextChannel(srv.update.name); 
                break;
            case 'addMember':
                server = await server.addMember(srv.update.id); 
                break;
            case 'removeMember':
                server = await server.removeMember(srv.update.id); 
                break;
            case 'addModerator':
                server = await server.addModerator(srv.update.id); 
                break;
            case 'removeModerator':
                server = await server.removeModerator(srv.update.id); 
                break;
            case 'addCommand':
                server = await server.addCommand(srv.update.name, srv.update.params);
                break;
            case 'removeCommand':
                server = await server.removeCommand(srv.update.name); 
                break;
            default: 
                server = await server.update(srv.update);
                break;
        }
        
    }

    server = await myFindById(server.id);

    return server.toObject();

}

async function deleteServer(id) {
    let server = await Server.findById(id)
    .populate('textChannels')
    .populate('commands').exec();

    if (!server) throw {errors: {serverNotFound: 'El servidor no se ha encontrado'}}


    let toDeletes = ['commands', 'textChannels'];

    for (const toDelete of toDeletes) {
        for(let elem of server[toDelete] || []) {
            await elem.remove();
        }
    }

    await server.remove();
    //server = await server.findById(server.id);
    return {};
}


module.exports = {
    createServer,
    getServer,
    updateServer,
    deleteServer,
    myFindById
}