
const mongoose = require('mongoose');
const Channel = require('./channel');
const Server = mongoose.model('Server', new mongoose.Schema());
const db = require('../services/db'); 
 
describe('channel model', () => {


    let checkFailFields = (err, flds) => {
        let fields = flds.split(' ');
        expect(err.errors).toBeDefined();
        for (let field of fields) {
            expect(err.errors[field]).toBeDefined();
        }
        expect(Object.keys(err.errors)).toHaveLength(fields.length);
    }

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

    it('save a channel correctly', async () => {

        let channel = {
            name: 'dgdfgsf',
            server: new Server()
        };

        channel = new Channel(channel);
        channel.validate();

    })

    it('save a channel without name', async () => {
        
        try {
            let channel = {
                server: new Server()
            };
    
            channel = new Channel(channel);
            await channel.save();
        } catch(err) {
            checkFailFields(err, 'name');
            expect(err.errors.name.kind).toBe('required');
        }
    })

    it('save a channel with invalid name', async () => {

        try {
            let channel = {
                name: 'd',
                server: new Server()
            };
    
            channel = new Channel(channel);
            await channel.save();
        } catch(err) {
    
            checkFailFields(err, 'name');
            expect(err.errors.name instanceof mongoose.Error.ValidatorError);
        }

    })

    it('save a channel with invalid type', async () => {

        try {
            let channel = {
                name: 'my new channel',
                server: new Server(),
                type: 'bad type'
            };
    
            channel = new Channel(channel);
            await channel.save();
        } catch(err) {
            
            checkFailFields(err, 'type');
            expect(err.errors.type.kind).toBe('enum');
        }

    })

    it('save a channel with incorrect data type for a field', async () => {

        try {
            let channel = {
                name: 'my new channel',
                server: 'new Server()'
            };
    
            channel = new Channel(channel);
            await channel.save();
        } catch(err) {
        
            checkFailFields(err, 'server');
            expect(err.errors.name instanceof mongoose.Error.CastError).toBe(true);
        }

    })

    it('save a channel with empty string as a name', async () => {

        try {
            let channel = {
                name: '',
                server: new Server()
            };
    
            channel = new Channel(channel);
            await channel.save();
        } catch(err) {
        
            checkFailFields(err, 'name');
            expect(err.errors.name.kind).toBe('required');
        }

    })
})