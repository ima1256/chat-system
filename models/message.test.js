const Message = require("./message");

const mongoose = require('mongoose');
const Channel = mongoose.model('Channel', new mongoose.Schema({}));
const User = mongoose.model('users', new mongoose.Schema({}));

const db = require('../services/db');


describe.only('message model', () => {

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

    it('create a message with text only correctly', async () => {

        let message = {
            text: 'Hola que tal',
            channel: new Channel(),
            user: new User()
        };

        message = new Message(message);
        await message.save();

    })

    it('create a message with text and one file correctly', async () => {

        let message = {
            text: 'Hola que tal',
            files: [
                {
                    name: 'index.html',
                    savedAs: 'dsfdsfsd-dfsdfasdf-dfsdf.html',
                    mimeType: 'html',
                    size: '324324234'
                }
            ],
            channel: new Channel(),
            user: new User()
        };

        message = new Message(message);
        await message.save();

    })

    it('create a message with text and multiple files correctly', async () => {
        
        let message = {
            text: 'Hola que tal',
            files: [
                {
                    name: 'index.html',
                    savedAs: 'dsfdsfsd-dfsdfasdf-dfsdf.html',
                    mimeType: 'html',
                    size: '324324234'
                },
                {
                    name: 'index.html',
                    savedAs: 'dsfdsfsd-dfsdfasdf-dfsdf.html',
                    mimeType: 'html',
                    size: '324324234'
                }
            ],
            channel: new Channel(),
            user: new User()
        };

        message = new Message(message);
        await message.save();

    })

    it('create a message with only one file correctly', async () => {
        let message = {
            files: [
                {
                    name: 'index.html',
                    savedAs: 'dsfdsfsd-dfsdfasdf-dfsdf.html',
                    mimeType: 'html',
                    size: '324324234'
                }
            ],
            channel: new Channel(),
            user: new User()
        };

        message = new Message(message);
        await message.save();
    })

    it('create a message with only multiple files correctly', async () => {
        let message = {
            files: [
                {
                    name: 'index.html',
                    savedAs: 'dsfdsfsd-dfsdfasdf-dfsdf.html',
                    mimeType: 'html',
                    size: '324324234'
                },
                {
                    name: 'index.html',
                    savedAs: 'dsfdsfsd-dfsdfasdf-dfsdf.html',
                    mimeType: 'html',
                    size: '324324234'
                }
            ],
            channel: new Channel(),
            user: new User()
        };

        message = new Message(message);
        await message.save();
    })

    let checkFailFields = (err, flds) => {
        let fields = flds.split(' ');
        expect(err.errors).toBeDefined();
        for (let field of fields) {
            expect(err.errors[field]).toBeDefined();
        }
        expect(Object.keys(err.errors)).toHaveLength(fields.length);
    }

    it('create a message without text nor files incorrecly', async () => {
        
        try {
            let message = {
                channel: new Channel(),
                user: new User()
            };
    
            message = new Message(message);
            await message.save();
        } catch(err) {
            checkFailFields(err, 'files');
            expect(err.errors.files.kind).toBe('required');
        }
        

    })

    it('create a message without user', async () => {
        
        try {

            let message = {
                text: 'HOla que tal',
                channel: new Channel()
            }

            message = new Message(message);
            await message.save();
        } catch(err) {
            checkFailFields(err, 'user');
            expect(err.errors.user.kind).toBe('required');
        }

    })

    it('create a message without channel', async () => {
        try {

            let message = {
                text: 'HOla que tal',
                user: new User()
            }

            message = new Message(message);
            await message.save();
        } catch(err) {
            checkFailFields(err, 'channel');
            expect(err.errors.channel.kind).toBe('required');
        }
    })

    const mongoose = require('mongoose');

    it('create a message passing as argument of some field a incorrect type', async () => {
        try {

            let message = {
                text: 'HOla que tal',
                user: 'new User()',
                channel: new Channel()
            }

            message = new Message(message);
            await message.save();
        } catch(err) {
            checkFailFields(err, 'user');
            expect(err.errors.user instanceof mongoose.Error.CastError).toBe(true);
           
            //expect(err.errors.user.kind).toBe('required');
        }

    })

})