const mongoose = require('mongoose');
const db = require('../services/db');
const { saveFile, removeUploads } = require('../utils/files');
const _ = require('lodash');

const User = require('../models/user');
const Server = require('../models/server');
const config = require('../config.json');
require('dotenv').config();

const host = process.env.HOST;
const port = process.env.PORT;

//Añadimos esto para cuando debuggeamos
jest.setTimeout(999999);

const preparedUsers = config.tests.user.prepared;
const correct = config.tests.user.correct;
const incorrect = config.tests.user.incorrect;

const axios = require('axios');
const axi = axios.create({
    baseURL: 'http://' + host + ':' + port + '/'
})

async function getUser(index) {
    return await new User(preparedUsers[index]).save();
}

async function _getServer(user=ObjectId()) {
    return await new Server({name: 'the new server', creator: user._id}).save();
}

function keys(elem) {
    if (typeof elem === 'string') return elem.split(' ');
    else return Object.keys(elem);
}

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

let ISEValidator = (err) => {
    expect(err.response).toBeDefined();
    expect(err.response.status).toBe(500);
    expect(err.response.data.error).toBeDefined();
}

let NFValidator = (err) => {
    expect(err.response).toBeDefined();
    expect(err.response.status).toBe(404);
    expect(err.response.data.error).toBeDefined();
}

let checkFailFields = (err, flds) => {
    let fields = flds.split(' ');
    expect(err.error).toBeDefined();
    for (let field of fields) {
        expect(err.error[field]).toBeDefined();
    }
    expect(Object.keys(err.error)).toHaveLength(fields.length);
}

const testNames = config.tests.testNames;
const serverService = require('../services/server');

myFindById = async function (id) {
    return (await Server.findById(id)
        .populate('creator', 'name id')
        .populate('members', 'name id')
        .populate('moderators', 'name id')
        .populate('textChannels', 'name').exec()).toObject();
}

const Channel = require('../models/channel');
const ServerCommand = require('../models/serverCommand');
const { ObjectId } = require('mongodb');

beforeAll(async () => {
    await db.connect();
    await db.clearDatabase();
})

afterEach(async () => {
    await db.clearDatabase();
})

afterAll(async () => {
    await db.closeDatabase();
})

let BRValidator = (err) => {
    expect(err.response.status).toBe(400);
    expect(err.response).toBeDefined();
    expect(err.response.data).toBeDefined();
    expect(Object.keys(err.response.data)).toStrictEqual(['message']);
}

describe('\naddMessagesToTextChannel', () => {

    const getRoute = (id, channelId, numMessages=undefined) => {
        let route = ['server', id, 'textChannel', channelId, 'addMessages'].join('/');
        return route; 
    } 

    it('add single message to text channel without files', async () => {

        let user = await getUser(0);
        let server = await _getServer(user);
        let channel = await Channel.findById(server.textChannels[0]);

        let messages = [
            {
                text: 'Hola que tal estamos',
                user: user.id
            }
        ]
        let res = await axi.put(getRoute(server.id, channel.id), {messages: messages});
        let restMessages = res.data.data;

        expect(res.status).toBe(200);

    })

    it.only('add single message with files to text channel', async () => {
        let user = await getUser(0);
        let server = await _getServer(user);
        let channel = await Channel.findById(server.textChannels[0]);


        let form = new FormData();
        let messages = [
            {
                text: 'Hola que tal estamos',
                user: user.id,
                files: [
                    fs.createReadStream(path.join(config.test, incorrect.avatars.incorrect_format[0])),
                    fs.createReadStream(path.join(config.test, incorrect.avatars.incorrect_format[1]))
                ]
            }
        ];


        for (const i in messages) {

            let fileStreams = messages[i].files;
            delete messages[i].files;
            form.append(`msg${i}`, JSON.stringify(messages[i]));
            
            for (let j in fileStreams) {
                const fileStream = fileStreams[j];
                form.append(`fls${i}-${j}`, fileStream);
            }
        }
           

        let res = await axi.put(getRoute(server.id, channel.id), form);
        let restMessages = res.data.data;

        console.log(restMessages);
        console.log(restMessages[0].files);

    })

    it('add multiple messages with files to text channel', async () => {
        
    })

    it('add messages to a channel that do not exist', async () => {

    })

    it('add messages to a channel that do exist but is not from server', async () => {

    })

    it('add more messages than the maximun', async () => {

    })

    it('add less messages than the minimun per query', async () => {

    })

    it('add messages to a server that do not exist', async () => {

    })

    //Invalid requests
    it('add messages sending params that are not mongoId', async () => {

    })

    it('add messages sending a query in the url', async () => {

    })

    it('add messages sending a invalid body formating', async () => {
        
    })

    it('add messages sending a invalid files formating', async () => {
        
    })

})

describe('\ngetMessagesFromTextChannel', () => {

    const getRoute = (id, channelId, numMessages=undefined) => {
        let route = ['server', id, 'textChannel', channelId, 'getMessages'].join('/');
        if (numMessages) route += '?numMessages=' + numMessages;
        return route; 
    } 

    it('get messages without specifying numMessages when there are more than the default num messages in the channel', async () => {

        let user = await getUser(0);
        let server = await _getServer(user);
        let channelId = server.textChannels[0].toString();

        //Añadimos 20 mensajes
        let messages = [];
        for (let i = 0; i < 20; i++) {
            let message = await new Message(
                {text: 'hola', channel: channelId, user: ObjectId(),
            files: [
                {
                    name: 'hola.js',
                    size: 34234
                },
                {
                    name: 'hola.js',
                    size: 34234
                }
            ]})
            .save();
            messages.push(getParsed(message));
        }
           

        let preServer = await Server.findById(server.id).exec();
        let res = await axi.get(getRoute(server.id, channelId, 15)); let restMessages = res.data.data;
        server = await Server.findById(server.id).exec();

        expect(restMessages).toStrictEqual(messages.slice(5, 20));
        expect(server.equals(preServer));

    })

    it('get messages sending invalid data in params, query', async () => {

        try {
            let server = await _getServer();
            let channelId = server.textChannels[0].toString();
            await axi.get(getRoute(server.id + 8678, channelId, 10));
            throw {}
        } catch (err) {
            BRValidator(err);
        }

        try {
            let server = await _getServer();
            let channelId = server.textChannels[0].toString();
            await axi.get(getRoute(server.id, channelId, 10) + '&invalidParam=value');
            throw {}
        } catch (err) {
            BRValidator(err);
        }

    })

    it('get messages when there are no messages in the channel', async () => {

        let user = await getUser(0);
        let server = await _getServer(user);
        let channelId = server.textChannels[0].toString();

        let preServer = await Server.findById(server.id).exec();
        let res = await axi.get(getRoute(server.id, channelId)); let restMessages = res.data.data;
        server = await Server.findById(server.id).exec();

        expect(restMessages).toStrictEqual([]);
        expect(server.equals(preServer));

    })

    const getParsed = (dbElem) => 
    JSON.parse(JSON.stringify(dbElem.toObject()))
    const Message = require('../models/message');
    const ObjectId = mongoose.Types.ObjectId;
    it('get less messages than there are in the channel', async () => {


        let user = await getUser(0);
        let server = await _getServer(user);
        let channel = await Channel.findById(server.textChannels[0]);

        await new Message({ user: ObjectId(), text: 'Hola 1', channel: channel._id }).save();
        await new Message({ user: ObjectId(), text: 'Hola 2', channel: channel._id }).save();
        let lastMessage = 
        await new Message({ user: ObjectId(), text: 'Hola 3', channel: channel._id })
        .save();
        lastMessage = getParsed(lastMessage);

        let res = await axi.get(getRoute(server.id, channel.id, 1)); let restMessages = res.data.data;
        expect(restMessages).toHaveLength(1);
        expect(_.isEqual(restMessages[0], lastMessage)).toBe(true);

    })

    it('get more messages than there are in the channel', async () => {

        let server = await _getServer(await getUser(0));
        let channel = await Channel.findById(server.textChannels[0]).exec();
        let anterior = await new Message({ user: ObjectId(), text: 'Hola', channel: channel._id }).save();
        let hola = await new Message({ user: ObjectId(), text: 'Hola', channel: channel._id }).save();
        let adios = await new Message({ user: ObjectId(), text: 'adios', channel: channel._id }).save();

        let restMessages = await axi.get(getRoute(server.id, server.textChannels[0].toString(), 2));
        let postServer = await Server.findById(server.id);

        expect(_.isEqual(restMessages, [getParsed(hola), getParsed(adios)]));
        expect(server.equals(postServer));

    })

    it('get messages from channel that do not exist', async () => {

        try {
            let server = await _getServer();
            await axi.get(getRoute(server.id, ObjectId(), 10));
            throw {}
        } catch (err) {
            NFValidator(err);
            checkFailFields(err.response.data, 'channelNotFound');
        }

    })

    it('get more messages than the maximun per query', async () => {

        try {
            let server = await _getServer();
            let channelId = server.textChannels[0].toString();
            await axi.get(getRoute(server.id, channelId, 300));
            throw {}
        } catch (err) {
            ISEValidator(err);
            checkFailFields(err.response.data, 'maxQuery');
        }

    })

    it('get 0 messages', async () => {

        try {
            let server = await _getServer();
            let channelId = server.textChannels[0].toString();
            await axi.get(getRoute(server.id, channelId, '0'));
            throw {}
        } catch (err) {
            ISEValidator(err);
            checkFailFields(err.response.data, 'minQuery');
        }

    })

})

const updateNames = testNames.updateServer;
describe('\nupdateServer', () => {

    let getRoute = (id, operation) => 'server/' + id + '/' + operation; 

    it(updateNames[0], async () => {
        let server = await _getServer(await getUser(0));
        let preServer = await axi.get('server/' + server.id); preServer = preServer.data.data;

        let res = await axi.put(getRoute(server.id, 'addTextChannel'), {name: 'the new text channel'});
    
        let restServer = res.data.data;
        
        expect(restServer.textChannels).toHaveLength(2);
        expect((restServer.textChannels[0]).name).toBe('canal de texto');
        expect((restServer.textChannels[1]).name).toBe('the new text channel');

        restServer.textChannels.pop();
        expect(_.isEqual(preServer, restServer)).toBe(true);


    })

    it(updateNames[1], async () => {

        let server = await _getServer(await getUser(0));
        await server.addTextChannel('canal de texto 2');
        let preServer = await axi.get('server/' + server.id); preServer = preServer.data.data;
        let res = await axi.put(getRoute(server.id, 'removeTextChannel'), {name: 'canal de texto 2'});

        let restServer = res.data.data;
        expect(restServer.textChannels).toHaveLength(1);
        expect(restServer.textChannels[0].name).toBe('canal de texto');
        preServer.textChannels.pop();
        expect(_.isEqual(preServer, restServer)).toBe(true);


    })

    it(updateNames[2], async () => {

        let server = await _getServer(await getUser(0));
        let preServer = await axi.get('server/' + server.id); preServer = preServer.data.data;
        let res = await axi.put(getRoute(server.id, 'addCommand'), {name: 'cd', parameters: 'hd dfds dfsf dfs'});
        
        let restServer = res.data.data;
        expect(restServer.commands).toHaveLength(1);
        const command = restServer.commands[0];

        expect(command.name).toBe('cd');
        expect(command.parameters).toStrictEqual('hd dfds dfsf dfs'.split(' '));
        delete restServer.commands;
        expect(_.isEqual(preServer, restServer));


    })

    it(updateNames[3], async () => {
        
        let server = await _getServer(await getUser(0));
        let preServer = await axi.get('server/' + server.id); preServer = preServer.data.data;
        await server.addCommand('cd');
        let res = await axi.put(getRoute(server.id, 'removeCommand'), {name: 'cd'});

        let restServer = res.data.data;
        expect(restServer.commands).toBeUndefined();
        expect(_.isEqual(preServer, restServer));

    })

    it(updateNames[4], async () => {
        
        let server = await _getServer(await getUser(0));
        let moderator = await getUser(1);
        let preServer = await axi.get('server/' + server.id); preServer = preServer.data.data;
        let res = await axi.put(getRoute(server.id, 'addModerator'), {id: moderator.id});
        let restServer = res.data.data;

        expect(restServer.moderators.filter(mod => mod._id === moderator.id)).toHaveLength(1);
        expect(restServer.moderators).toHaveLength(2);
        _.remove(restServer.moderators, mod => mod.id === moderator.id);
        expect(_.isEqual(restServer, preServer));

    })

    it(updateNames[5], async () => {
        
        const user = await getUser(0);
        let server = await _getServer(user);
        let preServer = await axi.get('server/' + server.id); preServer = preServer.data.data;
        let res = await axi.put(getRoute(server.id, 'removeModerator'), {id: user.id});
        let restServer = res.data.data;

        expect(restServer.moderators).toBeUndefined();
        preServer.moderators = undefined;
        expect(_.isEqual(restServer, preServer));
        
    })

    it(updateNames[6], async () => {
        let server = await _getServer(await getUser(0));
        let member = await getUser(1);
        let preServer = await axi.get('server/' + server.id); preServer = preServer.data.data;
        let res = await axi.put(getRoute(server.id, 'addMember'), {id: member.id});
        let restServer = res.data.data;

        expect(restServer.members.filter(mem => mem._id === member.id)).toHaveLength(1);
        expect(restServer.members).toHaveLength(2);
        _.remove(restServer.members, mem => mem.id === member.id);
        expect(_.isEqual(restServer, preServer));
    })

    it(updateNames[7], async () => {
        const user = await getUser(0);
        let server = await _getServer(user);
        
        let preServer = await axi.get('server/' + server.id); preServer = preServer.data.data;
        let res = await axi.put(getRoute(server.id, 'removeMember'), {id: user.id});
        let restServer = res.data.data;

        expect(restServer.members).toBeUndefined();
        expect(restServer.moderators).toBeUndefined();
        preServer.members = undefined;
        preServer.moderators = undefined;
        expect(_.isEqual(restServer, preServer));
    })

    it(updateNames[8], async () => {
        
        try {
            let server = await _getServer(await getUser(0));
            await axi.put(getRoute(server.id, 'removeCommand'), {name: 'cd'});
        } catch(err) {
            NFValidator(err);
            checkFailFields(err.response.data, 'commandNotFound');
        }

    })

    it(updateNames[9], async () => {
        
        try {
            let server = await _getServer(await getUser(0));
            await axi.put(getRoute(server.id, 'removeTextChannel'), {name: 'canalTextofdsfdsf'});
        } catch(err) {
            NFValidator(err);
            checkFailFields(err.response.data, 'textChannelNotFound');
        }

    })
    //mongoose.Types.ObjectId()
    it(updateNames[10], async () => {
        
        try {
            let server = await _getServer(await getUser(0));
            let fakeId = mongoose.Types.ObjectId().toString();
            await axi.put(getRoute(server.id, 'removeModerator'), {id: fakeId});
        } catch(err) {
            NFValidator(err);
            checkFailFields(err.response.data, 'mainUserNotFound');
        }

    })

    it(updateNames[11], async () => {
        
        try {
            let server = await _getServer(await getUser(0));
            let fakeId = mongoose.Types.ObjectId().toString();
            await axi.put(getRoute(server.id, 'removeMember'), {id: fakeId});
        } catch(err) {
            NFValidator(err);
            checkFailFields(err.response.data, 'mainUserNotFound');
        }

    })

    it(updateNames[12], async () => {
        
        try {
            let server = await _getServer(await getUser(0));
            let user2 = await getUser(1);
            await axi.put(getRoute(server.id, 'removeModerator'), {id: user2.id});
        } catch(err) {
            NFValidator(err);
            checkFailFields(err.response.data, 'moderatorNotFound');
        }

    })

    it(updateNames[13], async () => {
        try {
            let server = await _getServer(await getUser(0));
            let user2 = await getUser(1);
            await axi.put(getRoute(server.id, 'removeMember'), {id: user2.id});
        } catch(err) {
            NFValidator(err);
            checkFailFields(err.response.data, 'memberNotFound');
        }
    })

    it(updateNames[14], async () => {
        

        try {
            let server = await _getServer(await getUser(0));
            let preServer = await axi.get('server/' + server.id); preServer = preServer.data.data;

            axi.put(getRoute(server.id, 'removeCommand'), {name: 'my_command'})
            .then(res => {throw {}})
            .catch(err => {
                NFValidator(err);
                checkFailFields(err.response.data, 'commandNotFound');
            });

            server = await axi.get('server/' + server.id); erver = server.data.data;
            expect(_.isEqual(preServer, server));

        } catch(err) {
            console.log(err);
        }

    })

    it(updateNames[15], async () => {

        let server,preServer;
        try {
            server = await _getServer(await getUser(0));
            await server.removeTextChannel('canal de texto');

            preServer = await axi.get('server/' + server.id); preServer = preServer.data.data;
            
            await axi.put(getRoute(server.id, 'removeTextChannel'), {name: 'canal de texto'})
            throw {};
            
        } catch(err) {
            //console.log(err);
            NFValidator(err);
            checkFailFields(err.response.data, 'textChannelNotFound');
            server = await axi.get('server/' + server.id); server = server.data.data;
            expect(_.isEqual(preServer, server));
        }

    })

    it(updateNames[16], async () => {
        
        try {
            let user = await getUser(0);
            let server = await _getServer(user);
            await server.removeMember(user.id);

            let preServer = await axi.get('server/' + server.id); preServer = preServer.data.data;
            
            axi.put(getRoute(server.id, 'removeMember'), {id: user.id})
            .then(res => {throw {}})
            .catch(err => {
                //console.log(err);
                NFValidator(err);
                checkFailFields(err.response.data, 'memberNotFound');
            });

            server = await axi.get('server/' + server.id); erver = server.data.data;
            expect(_.isEqual(preServer, server));

        } catch(err) {
            console.log(err);
        }

    })

    it(updateNames[17], async () => {
        try {
            let user = await getUser(0);
            let server = await _getServer(user);
            await server.removeModerator(user.id);

            let preServer = await axi.get('server/' + server.id); preServer = preServer.data.data;
            
            axi.put(getRoute(server.id, 'removeModerator'), {id: user.id})
            .then(res => {throw {}})
            .catch(err => {
                NFValidator(err);
                checkFailFields(err.response.data, 'moderatorNotFound');
            });

            server = await axi.get('server/' + server.id); erver = server.data.data;
            expect(_.isEqual(preServer, server));

        } catch(err) {
            console.log(err);
        }
    })

})

describe('\ndeleteServer', () => {

    it(testNames.deleteServer[0], async () => {
        let user = await new User(preparedUsers[0]).save();
        let server = await new Server({ name: 'new server', creator: user.id }).save();
        server.commands.push((await new ServerCommand({ name: 'cd', server: server._id }).save())._id);
        await server.save();
        await axi.delete('server/' + server.id);

        let newServer = await Server.findById(server.id).exec();
        expect(newServer).toBe(null);

        for (let textChannelId of server.textChannels)
            expect(await Channel.findById(textChannelId).exec()).toBe(null);

        for (let commandId of server.commands)
            expect(await ServerCommand.findById(commandId).exec()).toBe(null);

    })

    it(testNames.deleteServer[1], async () => {

        try {
            let user = await new User(preparedUsers[0]).save();
            let server = await new Server({ name: 'new server', creator: user.id }).save();
            await server.remove();
            await axi.delete('server/' + server.id);
            throw {}
        } catch (err) {
            NFValidator(err);
            checkFailFields(err.response.data, 'serverNotFound');
        }

    })

    it(testNames.deleteServer[2], async () => {
        try {
            let user = await new User(preparedUsers[0]).save();
            let server = await new Server({ name: 'new server', creator: user.id }).save();
            await axi.delete('server/' + server.id);
        } catch(err) {
            expect(err.response).toBeDefined();
            expect(err.status).toBe(400);
        }
    })
})

describe('\ncreateServer', () => {

    it('create a server with required data (correct)', async () => {

        let user = await getUser(0);
        let res = await axi.post('server', { name: 'My server', creator: user.id });
        server = res.data.data;
        expect(keys(server)).toStrictEqual(keys('id name creator moderators members textChannels'));
        expect(res.status).toBe(201);
    })

    it('create a server with required data + avatar (correct)', async () => {

        let user = await getUser(0);
        let form = new FormData();
        form.append('creator', user.id);
        form.append('name', 'myNewServer');
        form.append('avatar',
            fs.createReadStream(path.join(config.uploads, correct.avatars[0])))
        let res = await axi.post('server', form);
        server = res.data.data;
        expect(res.status).toBe(201);

    })

    it('create a server with invalid avatar (incorrect)', async () => {

        for (const i in preparedUsers) {
            let user = await getUser(i);
            for (let j in incorrect.avatars.incorrect_format) {

                try {

                    let form = new FormData();
                    form.append('creator', user.id);
                    form.append('name', 'new server');
                    form.append('avatar',
                        fs.createReadStream(path.join(config.test, incorrect.avatars.incorrect_format[j])))
                    await axi.post('server', form);
                    throw {}
                } catch (err) {

                    expect(err.response.status).toBe(500);
                    checkFailFields(err.response.data, 'invalidAvatar');

                } finally { await db.clearDatabase(); }


            }

        }


    })

    it('create a server with invalid name (incorrect)', async () => {

        for (const i in preparedUsers) {
            for (let j in incorrect.names) {
                try {
                    let user = await getUser(i);
                    let form = new FormData();
                    form.append('creator', user.id);
                    form.append('name', incorrect.names[j]);
                    await axi.post('server', form);
                    throw {}
                } catch (err) {

                    checkFailFields(err.response.data, 'name');
                    expect(err.response.status).toBe(500);

                } finally { await db.clearDatabase(); }


            }

        }

    })

    it('create a server with a user that do not exist (incorrect)', async () => {

        try {
            let user = await getUser(0);
            await user.delete();
            await axi.post('server', { name: 'new server', creator: user._id });

        } catch (err) {
            expect(err.response).toBeDefined();
            expect(err.response.status).toBe(404);
            expect(err.response.data.error.mainUserNotFound).toBeDefined();
        }

    })

})

describe('\ngetServer', () => {

    it(testNames.getServer[0], async () => {

        let user = await new User(preparedUsers[0]).save();
        let server = await new Server({ name: 'my new server', creator: user.id }).save();
        let res = await axi.get('server/' + server.id);

        let restServer = res.data.data;
        expect(res.status).toBe(200);
        server = await myFindById(server.id);
        expect(_.isEqual(server, restServer));

    })

    it(testNames.getServer[1], async () => {

        try {
            let user = await new User(preparedUsers[0]).save();
            let server = await new Server({ name: 'server1', creator: user.id }).save();
            let res = await axi.get('server/' + server.id + 'dsfsf');
            throw {}
        } catch (err) {
            expect(err.response).toBeDefined();
            expect(err.response.status).toBe(400);
        }


    })

    it(testNames.getServer[2], async () => {

        try {
            let user = await new User(preparedUsers[0]).save();
            let server = await new Server({ name: 'server1', creator: user.id }).save();
            await server.delete();
            await axi.get('server/' + server.id);
            throw {}
        } catch (err) {
            NFValidator(err);
            checkFailFields(err.response.data, 'serverNotFound');
        }


    })

})
