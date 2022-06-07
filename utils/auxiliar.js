const path = require('path');
const config = require('./config.json');

console.log(path.join(config.uploads, 'hola.js'));

module.exports.getUser = async function getUser(req, res) {
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

module.exports.updateUser = async function (req, res) {

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

module.exports.deleteUser = async function (req, res) {

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
