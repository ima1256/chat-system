const mongoose = require('mongoose');
const Server = require('./server');

const channelSchema = new mongoose.Schema({
    name: {
        type: String,
        require: true
    },
    type: {
        type: String,
        enum: ['voice', 'text'],
        default: 'text',
        required: true
    },
    server: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Server',
        required: true
    }
})

const Channel = mongoose.model('Channel', channelSchema);

module.exports = Channel;