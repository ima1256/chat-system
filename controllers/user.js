const { getResponse } = require('../utils/response');
const { saveFile, existFile, deleteFile } = require('../utils/files');
const User = require('../models/user');
const userService = require('../services/user');
const _ = require('lodash');

const keys = ['name', 'email', 'password'];
const fileKeys = ['avatar'];
const validator = require('validator');

//El usuario debe subir una imagen, el servidor la guarda en jpg pero se puede subir en multiples formatos
const requestValidators = {
    createUser: [
        {
            validator: (req) => Object.keys(req.body).every(val => { return keys.includes(val) })
        },
        {
            validator: (req) => !req.files || Object.keys(req.files).every(val => { return fileKeys.includes(val) })
        }
    ],
    getUser: [
        {
            validator: (req) => req.params && Object.keys(req.params).length == 1
        },
        {
            validator: (req) => req.params.id && validator.isMongoId(req.params.id)
        }
    ],
    deleteUser: [
        {
            validator: (req) => !req.files && _.isEqual(req.body, {}) && _.isEqual(req.query, {})
        },
        {
            validator: (req) => req.params.id && validator.isMongoId(req.params.id)
        }
    ],
    updateUser: [
        {
            validator: (req) => _.isEqual(req.query, {})
        },
        {
            validator: (req) => req.params.id && validator.isMongoId(req.params.id)
        },
        {
            validator: (req) => Object.keys(req.body).every(val => User.getRequiredPaths().body.includes(val))
        },
        {
            validator: (req) => !req.files || Object.keys(req.files).every(val => User.getRequiredPaths().files.includes(val))
        }
    ],
    addFriendUser: [
        {
            validator: (req) => validator.isMongoId(req.params.friendId)
        },
        {
            validator: (req) => !req.files && _.isEqual(req.body, {}) && _.isEqual(req.query, {})
        },
        {
            validator: (req) => validator.isMongoId(req.params.id)
        }
    ],
    removeFriendUser: [
        {
            validator: (req) => validator.isMongoId(req.params.friendId)
        },
        {
            validator: (req) => !req.files && _.isEqual(req.body, {}) && _.isEqual(req.query, {})
        },
        {
            validator: (req) => validator.isMongoId(req.params.id)
        }
    ]
}

async function removeServerUser(req, res) {

    try {

        if (!requestValidators.removeServerUser.every(validate => validate.validator(req)))
            return res.status(400).json(getResponse('user', 400));

        const serverId = req.params.serverId;
        const userId = req.params.id;

        //let user = await userService.removeServerUser(userId, serverId);

        return res.status(200).json(getResponse('user', 200, user));

    } catch(err) {
        if (err.errors && (err.errors.mainUserNotFound || err.errors.serverNotFound)) return res.status(404).json(getResponse('user', 404, undefined, err));
        else return res.status(500).json(getResponse('user', 500, undefined, err));
    }

}

async function removeFriendUser(req, res) {
    try {
        if (!requestValidators.removeFriendUser.every(validate => validate.validator(req)))
            return res.status(400).json(getResponse('user', 400));

        const friendId = req.params.friendId;
        const userId = req.params.id;

        let user = await userService.removeFriendUser(userId, friendId);

        return res.status(200).json(getResponse('user', 200, user));

    } catch (err) {
        //Si no encontramos al usuario mandamos un 404
        if (err.errors && (err.errors.mainUserNotFound || err.errors.secondUserNotFound)) return res.status(404).json(getResponse('user', 404, undefined, err));
        else return res.status(500).json(getResponse('user', 500, undefined, err));
    }
}

async function addFriendUser(req, res) {

    try {
        if (!requestValidators.addFriendUser.every(validate => validate.validator(req)))
            return res.status(400).json(getResponse('user', 400));

        const friendId = req.params.friendId;
        const userId = req.params.id;

        let user = await userService.addFriendUser(userId, friendId);

        return res.status(200).json(getResponse('user', 200, user));
    } catch (err) {
        //Si no encontramos al usuario mandamos un 404
        if (err.errors && (err.errors.mainUserNotFound || err.errors.secondUserNotFound)) return res.status(404).json(getResponse('user', 404, undefined, err));
        else return res.status(500).json(getResponse('user', 500, undefined, err));
    }

}

async function updateUser(req, res) {

    try {

        if (!requestValidators.updateUser.every(elem => elem.validator(req)))
            return res.status(400).json(getResponse('user', 400));

        const id = req.params.id;
        let user = { ...req.body };

        if (req.files) user.avatar = req.files.avatar;
        user = await userService.updateUser(id, user);

        return res.status(200).json(getResponse('user', 200, user));

    } catch (err) {

        //Si no encontramos al usuario mandamos un 404
        if (err.errors && err.errors.mainUserNotFound)
            return res.status(404).json(getResponse('user', 400, undefined, err));
        else return res.status(500).json(getResponse('user', 500, undefined, err));
    }

}

async function createUser(req, res) {
    try {

        if (!requestValidators.createUser.every(elem => {
            return elem.validator(req)
        }))
            return res.status(400).json(getResponse('user', 400));

        let user = req.body;
        if (req.files) user.avatar = await saveFile(req.files.avatar)[0];

        user = await userService.createUser(user);

        return res.status(201).json(getResponse('user', 201, user));

    } catch (err) {
        return res.status(500).json(getResponse('user', 500, undefined, err));
    }
}

async function getUser(req, res) {
    try {

        if (!requestValidators.getUser.every(elem => elem.validator(req)))
            return res.status(400).json(getResponse('user', 400));

        const id = req.params.id;

        let user = await userService.getUser(id);

        return res.status(200).json(getResponse('user', 200, user));

    } catch (err) {
        return res.status(500).json(getResponse('user', 500, undefined, err));
    }
}

async function deleteUser(req, res) {
    try {

        if (!requestValidators.getUser.every(elem => elem.validator(req)))
            return res.status(400).json(getResponse('user', 400));

        const id = req.params.id;

        let user = await userService.deleteUser(id);

        return res.status(200).json(getResponse('user', 200, user));

    } catch (err) {
        return res.status(500).json(getResponse('user', 500, undefined, err));
    }
}

module.exports = {
    createUser,
    getUser,
    deleteUser,
    updateUser,
    addFriendUser,
    removeFriendUser
};
exports.createUser = createUser;
exports.getUser = getUser