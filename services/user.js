const User = require('../models/user');
const _ = require('lodash');
const {saveFile} = require('../utils/files');
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
async function addFriendUser(id, friendId) {

    let user = await User.findById(id).exec();

    if (!user) throw { errors: { mainUserNotFound: 'the user dont exist' } };

    let friend = await User.findById(friendId).exec();

    if (!friend) throw { errors: { secondUserNotFound: 'the user dont exist' } }

    if (user._id.equals(friend._id)) throw { errors: { friends: { kind: 'user defined', msg: 'cannot add user as its friend' } } };

    user.friends.push(friend._id);
    friend.friends.push(user._id);
    user.markModified('friends');
    friend.markModified('friends');
    await user.save();
    await friend.save();

    user = await User.findById(id).
    populate('servers').populate('friends').exec();

    return user;
}


async function removeFriendUser(id, friendId) {
    let user = await User.findById(id).exec();

    if (!user) throw { errors: { mainUserNotFound: 'the user dont exist' } };

    let friend = await User.findById(friendId).exec();

    if (!friend) throw { errors: { secondUserNotFound: 'the user dont exist' } };

    let removed = _.remove(user.friends, (value) => value.equals(friend._id));
    if (removed.length == 0) throw {errors: { notFriends: 'the pair of users are not friends'}};
    _.remove(friend.friends, (value) => value.equals(user._id));

    user.markModified('friends');
    friend.markModified('friends');
    await user.save();
    await friend.save();

    user = await User.findById(id).
    populate('servers').populate('friends').exec();

    return user;
}

async function addServerUser(id, serverId) {

    let user = await User.findById(id).exec();
    if (!user) throw { errors: { mainUserNotFound: 'the user dont exist' } };

    let server = await Server.findById(serverId).exec();
    if (!server) throw { errors: { serverNotFound: 'the user dont exist' } };

    user.servers.push(server._id);
    user.markModified('servers');
    server.push()

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
    addFriendUser,
    removeFriendUser,
    deleteUser
}