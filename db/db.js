//sudo systemctl start mongod

const mongoose = require('mongoose');
const Message = require('./message');
require('dotenv').config();
const data_point = process.env.DATA_POINT;

async function connect() {
    console.log(data_point);
    return await mongoose.connect(data_point);
}

async function disconnect() {
    console.log(data_point);
    return await mongoose.disconnect();
}

//This method receives a message({text, files}) and saves in the db
async function saveMessage(message) {

    const message_ = new Message({});
    message_.text = message.text;
    message_.files = message.files;
    message_.user = 'a user';
    message_.server = 'a server';

    await message_.save();
    //const message = new Message({ text: message.text, files });
    console.log('Message saved: ', message_);
}

async function getMessages(server, numMessages) {
    //.sort({_id:-1}).limit(numMessages)
    let messages = await Message.find({ server: server}).limit(numMessages).exec();
    console.log(messages);
    return messages;
}

exports.saveMessage = saveMessage;
exports.getMessages = getMessages;
exports.connect = connect;
exports.disconnect = disconnect;