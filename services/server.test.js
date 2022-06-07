const mongoose = require('mongoose');
const db = require('./db');
const { saveFile, removeUploads } = require('../utils/files');
const _ = require('lodash');

//Añadimos esto para cuando debuggeamos
jest.setTimeout(999999);

const {
    getServer,
    createServer,
    updateServer,
    deleteServer,
    addMemberServer,
    removeMemberServer,
    addModeratorServer,
    removeModeratorServer,
    addTextChannel,
    removeTextChannel
} = require('./user');

describe('\ncreateServer', () => {
    it('create a server correctly: name, avatar, creator', async () => {

        let server = 

    })
})

const User = require('../models/user');
const config = require('../config.json');