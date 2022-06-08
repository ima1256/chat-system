
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
            channel.validate();
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
            channel.validate();
        } catch(err) {
            console.log(err);
            checkFailFields(err, 'name');
            expect(err.errors.name.kind).toBe('required');
        }

    })

    it('save a channel with invalid type', async () => {

    })

    it('save a channel with incorrect data type for a field', async () => {

    })

    it('save a channel with empty string as a name', async () => {

    })
})