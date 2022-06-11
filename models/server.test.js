const Server = require('./server');
const db = require('../services/db');

//Aunque aqui estemos importando estos modelos, son mas simples que server
//por lo que podemos testear server unitariamente incluyendolos ya que una precondicion es que 
//loa modelos hijo funcionan
const User = require('./user');
const Channel = require('./channel');
const ServerCommand = require('./serverCommand');

const config = require('../config.json');
const { default: mongoose } = require('mongoose');

jest.setTimeout(999999);

const preparedUsers = config.tests.user.prepared;
const correct = config.tests.user.correct;
const incorrect = config.tests.user.incorrect;


describe('\nServer model', () => {

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

    let checkFailFields = (err, flds) => {
        let fields = flds.split(' ');
        expect(err.errors).toBeDefined();
        for (let field of fields) {
            expect(err.errors[field]).toBeDefined();
        }
        expect(Object.keys(err.errors)).toHaveLength(fields.length);
    }

    it('create a server with required data (correct)', async () => {

        let user = new User(preparedUsers[0]); await user.save();
        let server = {
            name: 'my new server',
            creator: user._id
        };
        server = new Server(server);

        await server.save();

        expect(server.moderators[0].equals(user._id)).toBe(true);
        expect(server.members[0].equals(user._id)).toBe(true);
        expect(server.creator.equals(user._id)).toBe(true);

    })

    it('save a server with an avatar that exist', async () => {

        let user = new User(preparedUsers[0]); await user.save();

        let server = new Server({
            name: 'new server',
            creator: user._id,
            avatar: correct.avatars[0]
        });

        await server.save();
        expect(server.moderators[0].equals(user._id)).toBe(true);
        expect(server.members[0].equals(user._id)).toBe(true);
        expect(server.creator.equals(user._id)).toBe(true);
        expect(server.avatar === correct.avatars[0]).toBe(true);

    })

    it('save a server with an avatar that dont exist', async () => {

        try {
            let user = new User(preparedUsers[0]); await user.save();

            let server = new Server({
                name: 'new server',
                creator: user._id,
                avatar: incorrect.avatars[0]
            });

            await server.save();
        } catch (err) {
            checkFailFields(err, 'avatar');
            expect(err.errors.avatar instanceof mongoose.Error.ValidatorError).toBe(true);
        }

    })

    const _ = require('lodash');

    it('save a server and append a new textChannel', async () => {



        let user = new User(preparedUsers[0]); await user.save();

        let server = await new Server({
            name: 'new server',
            creator: user._id
        }).save();

        let preChannels = [...server.textChannels];

        let preServer = await Server.findById(server._id);

        await server.addTextChannel('segundo canal de texto');

        let postChannels = [...preChannels];
        postChannels.push(_.last(server.textChannels));

        expect(_.isEqual(postChannels, server.textChannels))
            .toBe(true);

        server.textChannels.pop();

        expect(_.isEqual(preServer, server));

    })

    it('remove a textChannel from server', async () => {

        let user = new User(preparedUsers[0]); await user.save();

        let server = await new Server({
            name: 'new server',
            creator: user._id
        }).save();

        let preServer = server;

        await server.addTextChannel('segundo canal de texto');

        await server.removeTextChannel('segundo canal de texto');

        expect(_.isEqual(preServer, server));

    })

    it('save a server and add a new command', async () => {

        let user = new User(preparedUsers[0]); await user.save();

        let server = await new Server({
            name: 'new server',
            creator: user._id
        }).save();

        let preServer = server;
        await server.addCommand('hola', 'fsd dsf sdf');

        let command = await ServerCommand.findById(_.last(server.commands));

        expect(command.server.equals(server._id)).toBe(true);
        expect(command.name === 'hola').toBe(true);
        expect(command.parameters).toStrictEqual('fsd dsf sdf'.split(' '));

        let command2 = await ServerCommand.find({ name: 'hola', server: server._id });
        expect(command2).toHaveLength(1);
        command2 = command2[0];
        expect(command.equals(command2));

    })

    it('save a server and remove a command', async () => {
        let user = new User(preparedUsers[0]); await user.save();

        let server = await new Server({
            name: 'new server',
            creator: user._id
        }).save();

        let preServer = server;
        await server.addCommand('hola', 'fsd dsf sdf');
        let commandId = _.last(server.commands);
        await server.removeCommand('hola');

        expect(preServer.equals(server));
        expect(await ServerCommand.findById(commandId)).toBe(null);

    })

    let refresh = async server => await Server.findById(server._id).exec()

    it('save a server and append a new moderator', async () => {

        let user = new User(preparedUsers[0]); await user.save();

        let server = await new Server({
            name: 'new server',
            creator: user._id
        }).save();

        let preServer = await refresh(server);

        let moderator = await new User(preparedUsers[1]).save();
        await server.addModerator(moderator._id);
        server = await refresh(server);
        await expect(moderator._id.equals(server.moderators.pop())).toBe(true);
        expect(preServer.equals(server)).toBe(true);
    })

    it('save a server and remove a moderator', async () => {

        let user = new User(preparedUsers[0]); await user.save();

        let server = await new Server({
            name: 'new server',
            creator: user._id
        }).save();

        let preServer = await refresh(server);

        let moderator = await new User(preparedUsers[1]).save();

        await server.addModerator(moderator._id);
        await server.removeModerator(moderator._id);
        server = await refresh(server);

        expect(preServer.equals(server)).toBe(true);

    })

    it('save a server and append a new member', async () => {

        let user = new User(preparedUsers[0]); await user.save();

        let server = await new Server({
            name: 'new server',
            creator: user._id
        }).save();

        let preServer = await refresh(server);

        let member = await new User(preparedUsers[1]).save();

        await server.addMember(member._id);
        server = await refresh(server);
        expect(member._id.equals(server.members.pop())).toBe(true);
        expect(preServer.equals(server)).toBe(true);

    })

    it('save a server and remove a member', async () => {

        try {
            let user = new User(preparedUsers[0]); await user.save();

            let server = await new Server({
                name: 'new server',
                creator: user._id
            }).save();

            let preServer = await refresh(server);

            let member = await new User(preparedUsers[1]).save();

            await server.addMember(member._id);
            await server.removeMember(member._id);
            server = await refresh(server);
            expect(preServer.equals(server)).toBe(true);
        } catch (err) { console.log(err) }


    })

    it('save a server and try to remove a member do not exist', async () => {

        try {

            let user = await new User(preparedUsers[0]).save();

            let server = await new Server({
                name: 'new server',
                creator: user._id
            }).save();

            await user.delete();
            await server.removeMember(user._id);

        } catch(err){
            expect(err.errors.mainUserNotFound).toBeDefined();
            expect(Object.keys(err.errors)).toHaveLength(1);
        }

    })

    it('save a server and try to remove a member that do exist but is not in the server', async () => {
        
        try {

            let user = await new User(preparedUsers[0]).save();

            let server = await new Server({
                name: 'new server',
                creator: user._id
            }).save();

            await server.removeMember(user._id);
            await server.removeMember(user._id);

        } catch(err){
            expect(err.errors.memberNotFound).toBeDefined();
            expect(Object.keys(err.errors)).toHaveLength(1);
        }

    })

    it('save a server and try to remove a moderator that do not exist', async () => {

        try {

            let user = await new User(preparedUsers[0]).save();

            let server = await new Server({
                name: 'new server',
                creator: user._id
            }).save();

            await user.delete();
            await server.removeModerator(user._id);

        } catch(err){
            expect(err.errors.mainUserNotFound).toBeDefined();
            expect(Object.keys(err.errors)).toHaveLength(1);
        }

    })

    it('save a server and try to remove a moderator that do exist but is not in the server', async () => {
        
        try {

            let user = await new User(preparedUsers[0]).save();

            let server = await new Server({
                name: 'new server',
                creator: user._id
            }).save();

            await server.removeMember(user._id);
            await server.removeMember(user._id);

        } catch(err){
            expect(err.errors.moderatorNotFound).toBeDefined();
            expect(Object.keys(err.errors)).toHaveLength(1);
        }

    })

    it('save a server and try to remove a textChannel that do not exist', async () => {

        try {

            let user = await new User(preparedUsers[0]).save();

            let server = await new Server({
                name: 'new server',
                creator: user._id
            }).save();

            await server.removeTextChannel('dfasdfasf');

        } catch(err){
            expect(err.errors.textChannelNotFound).toBeDefined();
            expect(Object.keys(err.errors)).toHaveLength(1);
        }

    })

    it('save a server and try to remove a command that do not exist', async () => {

        try {

            let user = await new User(preparedUsers[0]).save();

            let server = await new Server({
                name: 'new server',
                creator: user._id
            }).save();

            await server.removeCommand('dfasdfasf');

        } catch(err){
            expect(err.errors.commandNotFound).toBeDefined();
            expect(Object.keys(err.errors)).toHaveLength(1);
        }

    })
    

})