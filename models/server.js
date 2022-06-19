const mongoose = require('mongoose');
const Channel = require('./channel');
const User = require('./user');
const ServerCommand = require('./serverCommand');
const { existFile } = require('../utils/files');
const _ = require('lodash');

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
        validator: (value) => true, msg: 'El creador del servidor debe ser moderador'
    }
]

const membersValidators = [
    {
        validator: (value) => true, msg: 'Debe haber al menos un miembro en el servidor'
    }
]

const textChannelsValidators = [
    {
        validator: (value) => true, msg: 'Debe haber al menos un canal de texto'
    }
]



const serverSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        validate: nameValidators
    },
    avatar: {
        type: String,
        validate: avatarValidators
    },
    creator: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'users',
        required: true
    },
    moderators: {
        type: [{
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'users'
        }],
        validate: moderatorsValidators
    },
    members: {
        type: [{
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'users'
        }],
        required: true,
        validate: membersValidators

    },
    textChannels: {
        type: [{
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'Channel'
        }],
        required: true,
        validate: textChannelsValidators
    },
    commands: {
        type: [{
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'ServerCommand'
        }]
    }
});

serverSchema.pre('validate', { document: true, query: false }, async function (next) {

    let server = this;

    if (server.isNew) {

        //Creamos un canal de texto por defecto
        let textChannel = new Channel({
            name: 'canal de texto',
            server: this._id,
        });

        await textChannel.save();
        server.textChannels.push(textChannel._id);
        server.markModified('textChannels');

        //Añadimos al creador del server como moderador y miembro
        server.members.push(server.creator);
        server.moderators.push(server.creator);
    }
    next();

});

const { isImage } = require('../utils/files');

serverSchema.statics.checkAvatar = function (avatar) {
    let error = !isImage(avatar) ? new Error('El avatar debe de ser una imagen') : undefined;
    return error;
}

// Duplicate the ID field.
serverSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

const config = require('../config.json');
require('dotenv').config();

serverSchema.methods.getAvatarUrl = function () {
    return `http://${process.env.HOST}:${process.env.PORT}/${config.routes.avatar}/${this.avatar}`;
}

getRequiredPaths = function () {
    return serverSchema.requiredPaths();
}

getUnrequiredPaths = function () {
    return serverSchema.requiredPaths();
}

function parse(doc, ret, options) {
    //console.log(doc);
    delete ret['__v'];
    delete ret['_id'];
    const id = ret.id;

    delete ret['id'];

    ret = { id, ...ret };
    ret.avatar = doc.getAvatarUrl()

    let paths = ['avatar', 'moderators', 'members', 'textChannels', 'commands'];

    for (const path of paths) {
        if (!doc[path] || !doc[path].length) delete ret[path];
    }

    return ret;
}

// Ensure virtual fields are serialised.
serverSchema.set('toJSON', {
    virtuals: true
});

// Ensure virtual fields are serialised.
serverSchema.set('toObject', {
    virtuals: true
});


serverSchema.options.toObject.transform = parse;
serverSchema.options.toJSON.transform = parse;

serverSchema.methods.addTextChannel = async function (name) {

    let server = this;

    let textChannel = new Channel({
        name: name,
        server: server._id
    });

    await textChannel.save();

    server.textChannels.push(textChannel._id);
    server.markModified('textChannels');
    return await server.save();

}

serverSchema.methods.removeTextChannel = async function (name) {

    let server = this;

    let textChannel = (await Channel.findOne({ name: name, server: server._id }).exec());

    if (!textChannel) throw { errors: { textChannelNotFound: 'El canal no se ha encontrado' } };

    _.remove(server.textChannels, id => {
        let equal = id.equals(textChannel._id);
        return equal;
    });

    await textChannel.remove();
    server.markModified('textChannels');
    return await server.save();
}

serverSchema.methods.addMember = async function (id) {

    let server = this;
    let member = await User.findById(id).exec();

    if (!member) throw { errors: { mainUserNotFound: 'El usuario no se ha encontrado' } };

    server.members.push(member._id);

    server.markModified('members');
    return await server.save();
}

serverSchema.methods.removeMember = async function (id) {
    let server = this;
    let member = await User.findById(id).exec();

    if (!member) throw { errors: { mainUserNotFound: 'El usuario no se ha encontrado' } };

    member = _.remove(server.members, id => member._id.equals(id))[0];

    if (!member) throw { errors: { memberNotFound: 'El usuario no es miembro del server' } };
    member = _.remove(server.moderators, id => member._id.equals(id))[0];

    if (!!member) server.markModified('moderators');

    server.markModified('members');
    return await server.save();
}

serverSchema.methods.addModerator = async function (id) {
    let server = this;

    let moderator = await User.findById(id).exec();

    if (!moderator) throw { errors: { mainUserNotFound: 'El usuario no se ha encontrado' } };

    server.moderators.push(moderator._id);

    server.markModified('moderators');
    return await server.save();
}

serverSchema.methods.removeModerator = async function (id) {
    let server = this;
    let moderator = await User.findById(id).exec();

    if (!moderator) throw { errors: { mainUserNotFound: 'El usuario no se ha encontrado' } };

    moderator = _.remove(server.moderators, id => moderator._id.equals(id))[0];

    if (!moderator) throw { errors: { moderatorNotFound: 'El usuario no es moderador del server' } };

    server.markModified('moderators');
    return await server.save();
}

serverSchema.methods.addCommand = async function (name, parametersAsString='') {
    let server = this;

    let command = await new ServerCommand({
        name: name,
        server: server._id,
        parameters: parametersAsString.split(' ')
    }).save();

    server.commands.push(command._id);

    server.markModified('commands');
    return await server.save();
}

serverSchema.methods.removeCommand = async function (name) {
    let server = this;
    let command = await ServerCommand.find({ name: name, server: server._id }).exec();

    if (command.length == 0) throw { errors: { commandNotFound: 'El usuario no se ha encontrado' } };

    command = command[0];

    _.remove(server.commands, id => command._id.equals(id));

    await ServerCommand.findByIdAndDelete(command._id);

    return await server.save();
}


serverSchema.methods.equals = function (otherServer) {
    //const difference = _.pickBy(otherServer, (v, k) => !_.isEqual(this[k], v));
    let paths = { ...serverSchema.paths };
    delete paths['__v'];
    for (const path of Object.keys(paths)) {
        if (!_.isEqual(this[path], otherServer[path])) {
            throw { errors: { objectsNotSame: `Objects are not the same in path ${path}\n ${this[path]} \n ${otherServer[path]}` } }
        }
    }
    return true;
    //return Object.keys(difference).every(key => !Object.keys(paths).includes(key));
}

let operations = {
    'update': 'name avatar',
    'addTextChannel': 'name',
    'removeTextChannel': 'name',
    'addMember': 'id',
    'removeMember': 'id',
    'addModerator': 'id',
    'removeModerator': 'id',
    'addCommand': 'name ?parameters',
    'removeCommand': 'name'
} 

serverSchema.statics.isOperation = function (operation) {  
    return Object.keys(operations).includes(operation);
}

serverSchema.statics.getOperationParameters = function (operation) {
    return operations[operation];
}

serverSchema.statics.correctParameters = function (operation, parameters) {
    if (!serverSchema.statics.isOperation(operation)) throw {errors: {operation: operation + ' is not a valid operation'}};
    
    let _rawParams = operations[operation].split(' ');

    let correctParams = _rawParams.map(value => {
        if(value.startsWith('?')) value = value.substring(1);
        return value;
    });

    let requiredParams = _rawParams.filter(value => !value.startsWith('?'));

    for (const param of parameters) {
        if (!correctParams.includes(param)) throw {errors: {operation: operation + ' has no parameter ' + param}}
    }

    return requiredParams.every(requiredParam => parameters.includes(requiredParam));
} 

const Server = mongoose.model('Server', serverSchema);

module.exports = Server;