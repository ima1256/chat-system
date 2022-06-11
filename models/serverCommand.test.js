const ServerCommand = require('./serverCommand');
const db = require('../services/db');
const command = require('nodemon/lib/config/command');
const mongoose = require('mongoose');
const Server = mongoose.model('Server', new mongoose.Schema())

describe('\nServerCommand model', () => {

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

    it('without parameters (correct)', async () => {

        const command = new ServerCommand({
            name: 'ls',
            server: new Server()
        })

        await command.save();

    })

    it('with parameters (correct)', async () => {

        await new ServerCommand({
            name: 'cd',
            server: new Server(),
            parameters: 'dsf df f fd f'.split(' ')
        }).save()

    })

    it('without name (incorrect)', async () => {
        
        try {
            let command = new ServerCommand({
                server: new Server(),
                parameters: 'dsfad fd fd fd'.split(' ')
            })
            await command.save();
        } catch(err) {
            checkFailFields(err, 'name');
            expect(err.errors.name.kind).toBe('required');
        }

    })

    it('without server (incorrect)', async () => {

        try {

            const command = new ServerCommand({
                name: 'cd'
            })

            await command.save();

        } catch(err) {
            checkFailFields(err, 'server');
            expect(err.errors.server.kind).toBe('required');
        }

    })
})