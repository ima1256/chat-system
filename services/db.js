//sudo systemctl start mongod
//Models 
const message = require('./message');
const user = require('./user');

const mongoose = require('mongoose');
require('dotenv').config();

//Constants

async function connect() {
    return await mongoose.connect(process.env.DATA_POINT);
}

async function disconnect() {
    return await mongoose.disconnect();
}

//User
async function getUser(id) {
    return await user.getUser(id);
}

async function createUser(usr) {
    return await user.createUser(usr);
}

async function updateUser(id, usr) {
    return await user.updateUser(id, usr);
}

async function deleteUser(id) {
    return await user.deleteUser(id);
}


exports.getUser = getUser;
exports.createUser = createUser;
exports.updateUser = updateUser;
exports.deleteUser = deleteUser;

exports.connect = connect;
exports.disconnect = disconnect;