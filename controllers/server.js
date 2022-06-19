const Server = require('../models/server');
const serverService = require('../services/server');
const { isImage, saveFile } = require('../utils/files');
const { getResponse } = require('../utils/response');
const _ = require('lodash-contrib');

function empty(obj) { return Object.keys(obj).length == 0 }
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
    ],
    getMessagesFromTextChannel: [
        (req) => validator.isMongoId(req.params.id) && validator.isMongoId(req.params.channelId),
        (req) => (_.isEqual(Object.keys(req.query), ['numMessages']) && isInt(req.query.numMessages))
            || empty(req.query),
        (req) => empty(req.body),
        (req) => !req.files
    ],
    addMessagesToTextChannel: [
        (req) => validator.isMongoId(req.params.id) && validator.isMongoId(req.params.channelId),
        (req) => empty(req.query),
        (req) => {
            let cond = _.isEqual(_.keys(req.body), ['messages']) && _.isArray(req.body.messages);
            cond += req.body.messages.every(message => _.isJSON(message) && Message.correctKeysBody(message));
            return cond;
        },
        (req) => true/*{
            let cond = !req.files;
            if (cond) return true;

            cond = _.isEqual(_.keys(req.files), ['messages']) && _.isArray(req.body.messages);

        } !req.files || _.isEqual(_.keys(req.files, ['messagesFiles']))*/
    ]
}

function isInt(str) {
    return !isNaN(str) && Number.isInteger(parseFloat(str));
}

const channelService = require('../services/channel');
const Message = require('../models/message');
const Channel = require('../models/channel');

function constructMessages(messages, messagesFiles, channel) {

    let dbInputMessages = []
    for (const key in messages) {
        let message = messages[key];
        for (const messageFiles of messagesFiles)
            dbInputMessages.push({ ...message, files: messageFiles, channel: channel._id });
    }
    return dbInputMessages;

}

function getMessageFilesKeys(req) {
    return _.keys(req.files).filter(_key=>_key.includes('-0')).map(_key=>_key.substring(0, 'flsX'.length));
}

//req.params = {id,channelId}
//req.query = {}
//req.body = {0, 1, 2, ...]}
//req.files = {0, 1, 2, ...]}
async function addMessagesToTextChannel(req, res) {
    try {
        if (!validators.addMessagesToTextChannel.every(validator => true))
            return res.status(400).json(getResponse('server', 400));

        //Save files
        let filesDbData = [];

        let fileKeys = getMessageFilesKeys(req);

        for (const key of fileKeys) {
            const messageFilesKeys = _.keys(req.files).filter(_key=>_key.startsWith(key));
            
            let messageFilesData = [];
            for (const messageFileKey of messageFilesKeys) {
                await saveFile(req.files[messageFileKey], messageFilesData);
            }
            filesDbData.push(messageFilesData);
        }

        //Check that the channel exist
        let channel = await Channel.findById(req.params.channelId).exec();
        if (!channel) throw { errors: { channelNotFound: 'El canal no se ha encontrado' } };

        //Construct messages
        for(const key in req.body) req.body[key] = JSON.parse(req.body[key]);
        let messages = constructMessages(req.body, filesDbData, channel);

        //Add messages to db
        channel = await channelService.addMessages(req.params.channelId, messages);

        //Get and parse
        messages = await channelService.getMessages(req.params.channelId, messages.length);
        let parsedMessages = [];
        for (const message of messages){
            parsedMessages.unshift(message.toObject());
        } 

        return res.status(200).json(getResponse('server', 200, parsedMessages));
    } catch (err) {
        if (err.errors && (
            err.errors.serverNotFound ||
            err.errors.channelNotFound
        )) return res.status(404).json(getResponse('server', 404, null, err));
        else return res.status(500).json(getResponse('server', 500, null, err));
    }
}

async function getMessagesFromTextChannel(req, res) {
    try {
        if (!validators.getMessagesFromTextChannel.every(validator => {
            return validator(req)
        }))
            return res.status(400).json(getResponse('server', 400));

        let server;
        let messages = await channelService.getMessages(req.params.channelId, req.query.numMessages || 15);
        //server = await serverService.myFindById(req.params.id).exec();
        let parsedMessages = [];
        for (const message of messages) {
            parsedMessages.unshift(message.toObject());
        }

        return res.status(200).json(getResponse('server', 200, parsedMessages));
    } catch (err) {
        if (err.errors && (
            err.errors.serverNotFound ||
            err.errors.channelNotFound
        )) return res.status(404).json(getResponse('server', 404, null, err));
        else return res.status(500).json(getResponse('server', 500, null, err));
    }
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
            server = await serverService.updateServer({ id: req.params.id, update: req.body })
        else
            server = await serverService.updateServer({
                operation: req.params.operation,
                id: req.params.id,
                update: req.body
            });

        return res.status(200).json(getResponse('server', 200, server));
    } catch (err) {
        if (err.errors && (
            err.errors.serverNotFound ||
            err.errors.mainUserNotFound ||
            err.errors.commandNotFound ||
            err.errors.textChannelNotFound ||
            err.errors.memberNotFound ||
            err.errors.moderatorNotFound
        )) return res.status(404).json(getResponse('server', 404, null, err));
        else return res.status(500).json(getResponse('server', 500, null, err));
    }

}

//req.body = {}
//req.params = {id}
//req.query = {}
//req.files = undfined
//res = {}
async function deleteServer(req, res) {
    try {
        if (!validators.deleteServer.every(validator => validator(req)))
            return res.status(400).json(getResponse('server', 400));

        await serverService.deleteServer(req.params.id);
        return res.status(200).json(getResponse('server', 200, {}));
    } catch (err) {
        if (err.errors && err.errors.serverNotFound) return res.status(404).json(getResponse('server', 404, null, err));
        return res.status(500).json(getResponse('server', 500, null, err))
    }
}

//req.body = {}
//req.params = {id}
//req.query = {}
//req.files = undfined
async function getServer(req, res) {
    try {

        if (!validators.getServer.every(validator => validator(req)))
            return res.status(400).json(getResponse('server', 400));

        let server = await serverService.getServer(req.params.id);

        return res.status(200).json(getResponse('server', 200, server));

    } catch (err) {
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

        if (!validators.createServer.every(validator => validator(req)))
            return res.status(400).json(getResponse('server', 400));

        let server = req.body;

        if (req.files && req.files.avatar) {
            server.avatar = req.files.avatar;
            //Guardar avatar si lo hay sino lanzar un error
            if (!isImage(server.avatar.name)) throw { errors: { invalidAvatar: 'El archivo avatar no es correcto' } };
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
exports.addMessagesToTextChannel = addMessagesToTextChannel
exports.getMessagesFromTextChannel = getMessagesFromTextChannel