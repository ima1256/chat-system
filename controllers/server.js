const Server = require('../models/server');
const serverService = require('../services/server');
const {isImage, saveFile} = require('../utils/files');
const {getResponse} = require('../utils/response');

const _ = require('lodash')

function empty(obj) {return Object.keys(obj).length == 0}
const validator = require('validator');

validator.isServerOperation = operation => {
    return Server.isOperation(operation);
}

const validators = {
    updateServer: [
        (req) => _.isEqual(Object.keys(req.params), ['id', 'operation']) && validator.isServerOperation(req.params.operation) 
        && validator.isMongoId(req.params.id),
        (req) => empty(req.query),
        (req) => Server.correctParameters(req.params.operation, Object.keys(req.body)),
        (req) => !req.files || _.isEqual(Object.keys(req.files), ['avatar'])
    ],
    deleteServer: [
        (req) => _.isEqual(Object.keys(req.params), ['id']) && validator.isMongoId(req.params.id),
        (req) => empty(req.query),
        (req) => empty(req.body),
        (req) => !req.files
    ],
    getServer: [
        (req) => _.isEqual(Object.keys(req.params), ['id']) && validator.isMongoId(req.params.id),
        (req) => empty(req.query),
        (req) => empty(req.body),
        (req) => !req.files
    ],
    createServer: [
        (req) => empty(req.params),
        (req) => empty(req.query),
        (req) => Object.keys(req.body).every(key => ['name', 'avatar', 'creator'].includes(key)),
        (req) => !req.files || _.isEqual(Object.keys(req.files), ['avatar'])
    ]
}

//req.body = {Server.getParams(operation)}
//req.params = {Server.getOperations()}
//req.query = {}
//req.files = undefined
//res = {server}
async function updateServer(req, res) {

    try {
        if (!validators.updateServer.every(validator => validator(req)))
            return res.status(400).json(getResponse('server', 400));

        let server;
        //'update' for simple update of the server, do not involve other models
        if (req.params.operation == 'update')
            server = await serverService.updateServer({id: req.params.id, update: req.body})
        else 
            server = await serverService.updateServer({operation: req.params.operation, 
                id: req.params.id, 
                update: req.body});

        return res.status(200).json(getResponse('server', 200, server));
    } catch(err) {
        if (err.errors && (err.errors.serverNotFound || err.errors.mainUserNotFound))
            return res.status(404).json(getResponse('server', 404, null, err));
        return res.status(500).json(getResponse('server', 500, null, err));
    }

}

//req.body = {}
//req.params = {id}
//req.query = {}
//req.files = undfined
//res = {}
async function deleteServer(req, res) {
    try {
        if(!validators.deleteServer.every(validator => validator(req)))
            return res.status(400).json(getResponse('server', 400));

        await serverService.deleteServer(req.params.id);
        return res.status(200).json(getResponse('server', 200, {}));
    } catch(err) {
        if(err.errors && err.errors.serverNotFound) return res.status(404).json(getResponse('server', 404, null, err));
        return res.status(500).json(getResponse('server', 500, null, err))
    }
}

//req.body = {}
//req.params = {id}
//req.query = {}
//req.files = undfined
async function getServer(req, res) {
    try {

        if(!validators.getServer.every(validator => validator(req)))
            return res.status(400).json(getResponse('server', 400));

        let server = await serverService.getServer(req.params.id);

        return res.status(200).json(getResponse('server', 200, server));

    } catch(err) {
        if (err.errors && err.errors.serverNotFound) return res.status(404).json(getResponse('server', 404, null, err));
        return res.status(500).json(getResponse('server', 500, null, err));
    }
}


//req.body = {name, avatar, creator}
//req.params = {}
//req.query = {}
//req.files = ?{avatar}
async function createServer(req, res) {

    try {

        if(!validators.createServer.every(validator => validator(req)))
            return res.status(400).json(getResponse('server', 400));

        let server = req.body;
       
        if(req.files && req.files.avatar) {
            server.avatar = req.files.avatar;
            //Guardar avatar si lo hay sino lanzar un error
            if (!isImage(server.avatar.name)) throw {errors: {invalidAvatar: 'El archivo avatar no es correcto'}};
            else server.avatar = (await saveFile(server.avatar))[0].savedAs;
        }

        server = await serverService.createServer(server);

        return res.status(201).json(getResponse('server', 201, server));

    } catch (err) {
        if (err.errors && err.errors.mainUserNotFound) return res.status(404).json(getResponse('server', 404, null, err));
        else return res.status(500).json(getResponse('server', 500, null, err)) 
    }
}

exports.getServer = getServer;
exports.createServer = createServer;
exports.updateServer = updateServer;
exports.deleteServer = deleteServer;