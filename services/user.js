const User = require('../models/user');
const _ = require('lodash');

async function getUser(id) {
    let user = await User.findById(id)
    .populate('servers').populate('friends').exec();
    return user;
}

async function createUser(usr) {
    
    let user = new User(usr);
    let error = user.checkPassword(user.password);
    if (error != undefined) throw {errors: {password: error}};
    user = await user.save(usr);
    //.select('name email password')
    /*user = await User.findById(user.id, 'name email password avatar')
    .exec();*/
    return user;
}

//Function to update user simple data (name, email, password, avatar)
async function updateUser(id, usr) {
    let user = await User.findByIdAndUpdate(id, usr, { new: true })
    .populate('servers').populate('friends').exec();
    return user;
}

//Puede llegar como parametro un objectId o un string, tenemos que mirar el tipo
async function addFriendUser(id, friendId) {

    let user = await User.findById(id).exec();

    if (!user) throw {errors: {mainUserNotExist: 'the user dont exist'}};

    let friend = await User.findById(friendId).exec();

    if (!friend) throw {errors: {secondUserNotExist: 'the user dont exist'}}

    user.friends.push(friend._id);
    friend.friends.push(user._id);
    await user.save();
    await friend.save();
    return user;
}


async function removeFriendUser(id, friendId) {
    let user = await User.findById(id).exec();

    if (!user) throw {errors: {mainUserNotExist: 'the user dont exist'}};

    let friend = await User.findById(friendId).exec();

    if (!friend) throw {errors: {secondUserNotExist: 'the user dont exist'}}

    _.remove(user.friends, (value) => value.equals(friend._id));
    console.log(friend.friends);
    _.remove(friend.friends, (value) => value.equals(user._id));
    console.log(friend.friends);
    await user.save();
    await friend.save();
    return user;
}

async function deleteUser(id) {
    let user;
    await User.findByIdAndDelete(id, (err, docs) => {
        user = docs;
    });
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