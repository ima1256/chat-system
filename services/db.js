//sudo systemctl start mongod
//Models 
const message = require('./message');
const user = require('./user');

const mongoose = require('mongoose');
require('dotenv').config();


//User
async function getUser(id) {
    return user.getUser(id);
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

//const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongod = new MongoMemoryServer();

// connect to db
module.exports.connect = async () => {
    const uri = process.env.DATA_POINT;//await mongod.getUri();
    const mongooseOpts = {
        useNewUrlParser: true,
        useUnifiedTopology: true
    };
    await mongoose.connect(uri, mongooseOpts);
}
// disconnect and close connection
module.exports.closeDatabase = async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongod.stop();
}
// clear the db, remove all data
module.exports.clearDatabase = async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany();
    }
}

exports.getUser = getUser;
exports.createUser = createUser;
exports.updateUser = updateUser;
exports.deleteUser = deleteUser;