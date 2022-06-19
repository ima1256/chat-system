const User = require('../models/user');
const _ = require('lodash');
const { saveFile } = require('../utils/files');
//const Server = require('../models/server');

async function getUser(id) {
    let user = await User.findById(id)
        .populate('servers').populate('friends').exec();

    if (!user) throw { errors: { mainUserNotFound: 'the user dont exist' } };

    return user;
}

async function createUser(usr) {

    let user = new User(usr);
    let error = user.checkPassword(user.password);
    if (error != undefined) throw { errors: { password: error } };
    user = await user.save(usr);
    return user;
}

//Function to update user simple data (name, email, password, avatar)
async function updateUser(id, usr) {

    try {
        let user = await User.findById(id);

        if (!user) throw { errors: { mainUserNotFound: 'the user dont exist' } };

        if (usr.password) {
            let error = user.checkPassword(usr.password);
            if (error != undefined) throw { errors: { password: error } };
        }

        let usr_ = { ...usr };
        //user.avatar == req.files.avatar
        if (usr.avatar) {
            let error = user.checkAvatar(usr.avatar.name);
            if (error != undefined) throw { errors: { avatar: error } };
            else usr_.avatar = (await saveFile(usr.avatar))[0].savedAs;
        }

        user = await User.findByIdAndUpdate(id, usr_, { new: true })
            .populate('servers').populate('friends').exec();

        return user;
    } catch (err) { console.log(err) }
}

//Puede llegar como parametro un objectId o un string, tenemos que mirar el tipo
async function addFriend(id, friendId) {

    let user = await User.findById(id).exec();
    if (!user) throw { errors: { mainUserNotFound: 'the user dont exist' } };

    return await user.addFriend(friendId);
}


async function removeFriend(id, friendId) {
    
    let user = await User.findById(id).exec();
    if (!user) throw { errors: { mainUserNotFound: 'the user dont exist' } };
    return await user.removeFriend(friendId);
}

async function addServer(id, serverId) {

    let user = await User.findById(id).exec();
    if (!user) throw { errors: { mainUserNotFound: 'the user dont exist' } };

    return await user.addServer(serverId);

}

async function removeServer(id, serverId) {

    let user = await User.findById(id).exec();
    if (!user) throw { errors: { mainUserNotFound: 'the user dont exist' } };
    return await user.removeServer(serverId);

}

async function deleteUser(id) {
    let user;
    user = await User.findByIdAndDelete(id);
    if (!user) throw { errors: { mainUserNotFound: 'the user dont exist' } };
    return user;
}

module.exports = {
    getUser,
    createUser,
    updateUser,
    addFriend,
    removeFriend,
    addServer,
    removeServer,
    deleteUser
}