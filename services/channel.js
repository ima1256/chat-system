const Channel = require('../models/channel');

async function getMessages(id, num) {

    let channel = await Channel.findById(id).exec();
    if(!channel) throw {errors: {channelNotFound: 'el canal no existe'}};

    if (num > Channel.getMaxQuery()) throw {errors: {maxQuery: 'La query excede el maximo numero de mensajes por query'}} 
    if (num < 1) throw {errors: {minQuery: 'Por favor solicita mas mensajes'}}

    return await channel.getMessages(num);

}

const User = require('../models/user');

async function addMessages(id, messages) {
    let channel = await Channel.findById(id).exec();
    if (!channel) throw {errors: {channelNotFound: 'El canal no se ha encontrado'}};

    if (messages.constructor == Array) {

        let num = messages.length;
        if (num > Channel.getMaxQuery()) throw {errors: {maxQuery: 'La query excede el maximo numero de mensajes por query'}} 
        if (num < 1) throw {errors: {minQuery: 'Por favor solicita mas mensajes'}}

        for (const msg of messages) {
            let user = await User.findById(msg.user).exec();
            if (!user) throw { errors: { userNotFound: 'El usuario no se ha encontrado' } };
            await channel.addMessage(msg);
        }
    } else {
        let msg = messages;
        let user = await User.findById(msg.user).exec();
        if (!user) throw { errors: { userNotFound: 'El usuario no se ha encontrado' } };
        await channel.addMessage(msg);
    } 

    return channel;
}

module.exports = {
    getMessages,
    addMessages
}