const db = require("../services/db");
const { getResponse } = require('../utils/response');
const fileManager = require('../utils/files');

const keys = ['name', 'email', 'password'];
const fileKeys = ['avatar'];

async function getUser(req, res) {
    try {
        await db.connect();

        if (!Object.keys(body).every(val => { keys.includes(val)}))
            return res.status(400).json(getResponse('user', 400));

        let user = await db.getUser(req.params.id);

        if (user == null)
            return res.status(404).json(getResponse('user', 404))

        res.status(200).send(getResponse('user', 200, user))

    } catch (err) {
        res.status(500).send(getResponse('user', 500, null, err));
    } finally {
        await db.disconnect();
    }
}

async function createUser(req, res) {
    try {

        await db.connect();

        if (!Object.keys(req.body).every(val => { return keys.includes(val)}) 
            || !Object.keys(req.files).every(val => { return fileKeys.includes(val)}))
            return res.status(400).json(getResponse('user', 400));

        let user = req.body;
        if (req.files.avatar) {
            let data = await fileManager.saveFile(req.files.avatar)[0];
            user.avatar = data;
        }

        console.log(user);

        user = await db.createUser(user);
        res.status(201).send(getResponse('user', 201, user));

    } catch (err) {
        console.log(err);
        res.status(500).send(getResponse('user', 500, null, err));
    } finally {
        await db.disconnect();
    }
}

async function updateUser(req, res) {

    try {

        await db.connect();

        if (!Object.keys(req.body).every(val => { return keys.includes(val)}) ||
            !Object.keys(req.files).every(val => { return fileKeys.includes(val)}))
            return res.status(400).json(getResponse('user', 400));

        let user = {};
        if (req.files.avatar) {
            let data = await fileManager.saveFile(req.files.avatar)[0];
            user.avatar = data;
        }

        user = req.body;
        user = await db.updateUser(user);
        res.status(200).send(getResponse('user', 200, user));

    } catch (err) {
        res.status(500).send(getResponse('user', 500, null, err));
    } finally {
        await db.disconnect();
    }

}

async function deleteUser(req, res) {

    try {

        await db.connect();

        let user = await db.getUser(req.params.id);
        if(!user) return res.status(404).send(getResponse('user', 404));

        await db.deleteUser(req.params.id);

        res.status(200).send(getResponse('user', 200))

    }catch (err) {
        res.status(500).send(getResponse('user', 500, null, err));
    } finally {
        await db.disconnect();
    }
}

exports.getUser = getUser;
exports.createUser = createUser;
exports.updateUser = updateUser;
exports.deleteUser = deleteUser;