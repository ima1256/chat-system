const User = require('../models/user');

async function getUser(id) {
    let user = await User.findById(id).exec();
    return user;
}

async function createUser(usr) {
    let user = await User.create(usr);
    //.select('name email password')
    user = await User.findById(user._id, 'name email password').exec();

    return user;
}

async function updateUser(id, usr) {

    let user = await User.findByIdAndUpdate(id, usr, {new: true}).exec();
    return user;
}

async function deleteUser(id) {
    let user;
    await User.findByIdAndDelete(id, (err, docs)=>{
        user = docs;
    });
    return user;
}

module.exports = {
    getUser,
    createUser,
    updateUser,
    deleteUser
}