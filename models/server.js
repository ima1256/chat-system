const mongoose = require('mongoose');

const serverSchema = new mongoose.Schema({
    moderators: {
        type: [String]
    },  //Id of the moderators of the server
    creator: {
        type: String,
        required: true
    },     //Id of the user that created the server
    textChannels: {
        type: [String], //Array with ids
    },
    voiceChannels: [String] //Array with ids
});

const Server = mongoose.model('Server', serverSchema);

module.exports = Server;