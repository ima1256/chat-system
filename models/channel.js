const mongoose = require('mongoose');

const channelSchema = new mongoose.Schema({
    name: {
        type: String,
        require: true
    },
    server: {
        type: String,
        required: true
    }
})

const channelModel = mongoose.Model('Channel', channelSchema);

module.exports = channelModel;