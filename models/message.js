const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    text: String,   //Text of the message
    files: [Object], //Path to the files of the message or empty array
    type: {
        type: String,
        enum: ['server', 'direct'],
        default: 'server'
    },
    server: {
        type: String,
        required: true
    },  //Id of the server
    user: {
        type: String,
        required: true
    } //Id of the user that send the message
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;