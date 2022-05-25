const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    text: String,   //Text of the message
    files: [Object], //Path to the files of the message or empty array
    server: String,  //Id of the server
    user: String      //Id of the user that send the message
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;