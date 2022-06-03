const mongoose = require('mongoose');

const serverSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        validate: (value) => {
            return /^[A-Za-z].*$/.test(value) && value.length >= 3;
        }
    },
    moderators: [{
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User'
    }],  //Id of the moderators of the server
    creator: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User',
        required: true
    },     //Id of the user that created the server
    textChannels: {
        type: [{
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'Channel' //Array with ids
        }],
        required: true,
        validate: (value) => {
            return value.length > 0;
        }
    },
});

const Server = mongoose.model('Server', serverSchema);

module.exports = Server;