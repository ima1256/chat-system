const mongoose = require('mongoose');
const Channel = require('./channel');
const User = require('./user');

const avatarValidators = [
    {
        validator: (value) => value.split('.').pop() == 'jpg', msg: 'El formato no es correcto'
    },
    {
        validator: (value) => existFile(value), msg: 'El fichero no se encuentra en el directorio de uploads'
    }
]

const nameValidators = [
    {
        validator: (value) => value.length >= 3, msg: 'El nombre tiene que tener al menos tres simbolos'
    },
    {
        validator: (value) => /^[A-Za-z].*$/.test(value), msg: 'El nombre debe empezar por una letra'
    }
]

const moderatorsValidators = [
    {
        validator: (value) => value.length > 0, msg: 'El creador del servidor debe ser moderador'
    }
]

const membersValidators = [
    {
        validator: (value) => value.length > 0, msg: 'Debe haber al menos un miembro en el servidor'
    }
]

const textChannelsValidators = [
    {
        validator: (value) => value.length > 0, msg: 'Debe haber al menos un canal de texto'
    }
]

const voiceChannelsValidators = [
    {
        validator: (value) => value.length > 0, msg: 'Debe haber al menos un canal de voz'
    }
]

//Mirar expresiones regulares
const commandsValidators = [
    {
        validator: (value) => true, msg: ''
    }
]

const serverSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        validate: nameValidators
    },avatar: {
        type: String,
        validate: avatarValidators
    },
    creator: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User',
        required: true
    },
    moderators: {
        type: [{
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'User'
        }],
        default: [this.creator],
        validate: moderatorsValidators
    },
    members: {
        type: [{
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'User'
        }],
        default: [this.creator],
        required: true,
        validate: membersValidators
        
    },
    textChannels: {
        type: [{
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'Channel',
            validate: nameValidators
        }],
        required: true,
        validate: textChannelsValidators
    },
    commands: {
        type: Object,
        validate: commandsValidators
    }
});

//Mirar expresiones regulares
serverSchema.methods.getAcronym = (name) => {
    return name;
}

const Server = mongoose.model('Server', serverSchema);

module.exports = Server;