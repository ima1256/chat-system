const Message = require('../models/message');

async function getMessage(id) {
    let message = await Message.find({_id:id}).exec();
    return message;
}

async function createMessage(msg) {

    const message = new Message({msg});
    await message.save();
}

async function updateMessage(id, msg) {

    let message = await Message.find({_id:id}).exec();
    return message;
}

async function deleteMessage(id) {
    let message = await Message.find({_id:id}).exec();
    return message;
}


exports.getMessage = getMessage;
exports.createMessage = createMessage;
exports.updateMessage = updateMessage;
exports.deleteMessage = deleteMessage;