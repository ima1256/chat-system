const mongoose = require('mongoose');

const nameValidators = [
    {
        validator: (value) => /^[A-Za-z].*$/.test(value), msg: 'El nombre debe empezar por una letra'
    },
    {
        validator: (value) => value.length >= 3, msg: 'El nombre debe tener al menos tres simbolos'
    }
]

//Los mensajes del canal no los guardamos en el canal se guarda la referencia de los mismos con el canal en la base de datos
const channelSchema = new mongoose.Schema({
    name: {
        type: String,
        validate: nameValidators,
        required: true
    },
    type: {
        type: String,
        enum: ['server', 'direct'],
        default: 'server',
        required: true
    },
    server: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Server',
        required: true
    }
})

const Message = require('./message');
const _ = require('lodash');

channelSchema.statics.getMaxQuery = function () {
    return 50;
}

//channelSchema.methods.addMessage = async function()

channelSchema.methods.getMessages = async function (numMessages) {

    let channel = this;

    let messages = await Message.find({ channel: channel._id })
        .sort({ _id: - 1 })
        .limit(numMessages).exec();

    return messages;

}


channelSchema.methods.addMessage = async function (message) {

    await new Message(message).save();

    return this;

}

channelSchema.methods.equals = function (otherChannel) {
    let paths = { ...channelSchema.paths };
    delete paths['__v'];
    for (const path of Object.keys(paths)) {
        if (!_.isEqual(this[path], otherChannel[path])) {
            throw { errors: { objectsNotSame: `Channels are not the same in path ${path}\n ${this[path]} \n ${otherChannel[path]}` } }
        }
    }
    return true;
}

const Channel = mongoose.model('Channel', channelSchema);

module.exports = Channel;