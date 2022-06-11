const mongoose = require('mongoose');
const db = require('./db');
const { saveFile, removeUploads } = require('../utils/files');
const _ = require('lodash');

const User = require('../models/user');
const config = require('../config.json');

//Añadimos esto para cuando debuggeamos
jest.setTimeout(999999);

const {
    createServer,
} = require('./server');

const preparedUsers = config.tests.user.prepared;
const correct = config.tests.user.correct;
const incorrect = config.tests.user.incorrect;

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

describe('\ncreateServer', () => {

    it('create a server with required data (correct)', async () => {

        let user = await new User(preparedUsers[0]); await user.save();

        let server = await createServer({
            name: 'my new server',
            creator: user._id
        });

    })

    it('create a server with required data + avatar (correct)', async () => {

        let user = await new User(preparedUsers[0]); await user.save();

        let server = await createServer({
            name: 'my new server',
            creator: user._id,
            avatar: correct.avatars[0]
        });

    })

    const incorrect = config.tests.user.incorrect;

    it('create a server with required data + not existing avatar (incorrect)', async () => {

        try {

            let user = await new User(preparedUsers[0]); await user.save();

            let server = await createServer({
                name: 'my new server',
                creator: user._id,
                avatar: incorrect.avatars.not_found[0]
            });

        } catch (err) {

          
            expect(err.errors.avatar).toBeDefined();
            
        }

    })

    it('create a server with invalid name (incorrect)', async () => {

        try {

            let user = await new User(preparedUsers[0]); await user.save();

            let server = await createServer({
                name: 'd',
                creator: user._id,
                avatar: incorrect.avatars.not_found[0]
            });

        } catch (err) {

           
            expect(err.errors.name).toBeDefined();
            
        }

    })

    it('create a server with a user that do not exist (incorrect)', async () => {

        try {

            let user = await new User(preparedUsers[0]); await user.save();
            await user.delete();

            let server = await createServer({
                name: 'd',
                creator: user._id,
                avatar: incorrect.avatars.not_found[0]
            });

        } catch (err) {

           
            expect(err.errors.mainUserNotFound).toBeDefined();
            
        }

    })

})

describe('\ngetServer', () => {

})
