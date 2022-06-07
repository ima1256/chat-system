const axios = require('axios');
require('dotenv').config();
const db = require('../services/db');
const userService = require('../services/user');
const port = process.env.PORT;
const host = process.env.HOST;
const config = require('../config.json');
const { getEncrypted } = require('../utils/password');
const bcryptjs = require('bcryptjs');

const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const correct = config.tests.user.correct;

const _ = require('lodash');

jest.setTimeout(999999);

const url = 'http://localhost:3000/user';

const axi = axios.create({
    baseURL: 'http://' + host + ':' + port + '/',
    //timeout: 2500,
    headers: {
        'Content-Type': 'multipart/form-data',
        "Access-Control-Allow-Origin": "*",
    }
});

const preparedUsers = config.tests.user.prepared;
const incorrect = config.tests.user.incorrect;

const getFields = (({ name, email, avatar }) => {

    if (avatar != undefined) return { name, email, avatar };
    return { name, email };
});

describe('\nupdateUser', () => {

    beforeAll(async () => {
        await db.connect();
        await db.clearDatabase();
    })
    afterEach(async () => {
        await db.clearDatabase();
    })
    afterAll(async () => {
        await db.closeDatabase();
    })

    it('name of a user correct', async () => {

        let user = await userService.createUser(preparedUsers[1]);
        let res = await axi.put('user/' + user.id, { name: correct.names[0] });
        expect(res.data.data.name).toBe(correct.names[0]);

    })

    it('email of a user correct', async () => {
        let user = await userService.createUser(preparedUsers[1]);
        let res = await axi.put('user/' + user.id, { email: correct.emails[0] });
        expect(res.data.data.email).toBe(correct.emails[0]);
    })

    it('password of a user correct', async () => {
        let user = await userService.createUser(preparedUsers[1]);
        let res = await axi.put('user/' + user.id, { password: correct.passwords[0] });
        expect(res.data.data.password).toBe(correct.passwords[0]);
    })

    it.only('avatar of a user correct', async () => {
        let user = await userService.createUser(preparedUsers[1]);
        let form = new FormData();
        form.append('avatar', fs.createReadStream(path.join(config.uploads, correct.avatars[0])));
        let res = await axi.put('user/' + user.id, form);

        console.log(res);
        expect(res.data.data.avatar).toBeDefined();
        expect(res.data.data.avatar.name).toBe(correct.avatars[0]);
        expect(path.extname(res.data.data.avatar.savedAs)).toBe('jpg')
        expect(res.data.data.avatar.mimeType).toBe(path.extname(correct.avatars[0]));
    })

    it('name of a user incorrect', async () => {

        let user = await userService.createUser(preparedUsers[1]);

        try {
            await axi.put('user/' + user.id, { name: incorrect.names[0] });
        } catch (err) {
            expect(err.response).toBeDefined();
            expect(err.response.status).toBe(500);
            expect(err.response.data.error).toBeDefined();
            expect(err.response.data.error.name).toBeDefined();
            expect(Object.keys(err.response.data.error)).toHaveLength(1)
        }

    })

    it('email of a user incorrect', async () => {
        let user = await userService.createUser(preparedUsers[1]);

        try {
            await axi.put('user/' + user.id, { email: incorrect.emails[0] });
        } catch (err) {
            expect(err.response).toBeDefined();
            expect(err.response.status).toBe(500);
            expect(err.response.data.error).toBeDefined();
            expect(err.response.data.error.email).toBeDefined();
            expect(Object.keys(err.response.data.error)).toHaveLength(1)
        }
    })

    it('password of a user incorrect', async () => {
        let user = await userService.createUser(preparedUsers[1]);

        try {
            await axi.put('user/' + user.id, { password: incorrect.passwords[0] });
        } catch (err) {
            expect(err.response).toBeDefined();
            expect(err.response.status).toBe(500);
            expect(err.response.data.error).toBeDefined();
            expect(err.response.data.error.password).toBeDefined();
            expect(Object.keys(err.response.data.error)).toHaveLength(1)
        }
    })

    it('inalid param !avatar for avatar field', async () => {

        let user = await userService.createUser(preparedUsers[1]);

        let form = new FormData();
        form.append('!avatar', fs.createReadStream(path.join(config.uploads, correct.avatars[0])));
        await axi.put('user/' + user.id, form, {validateStatus: status => status == 400});
      
    })

    let ISEValidator = (err) => {
        expect(err.response).toBeDefined();
        expect(err.response.status).toBe(500);
        expect(err.response.data.error).toBeDefined();
    }

    it('invalid avatar format .pdf for avatar field', async () => {

        let user = await userService.createUser(preparedUsers[1]);
        let form = new FormData();
        form.append('avatar', fs.createReadStream(path.join(config.uploads, incorrect.avatars.incorrect_format[0])))

        try {
            await axi.put('user/' + user.id, form);
        } catch(err) {
            //ISEValidator(err);
            expect(err.response).toBeDefined();
            expect(err.response.status).toBe(500);
            console.log(err.response.data);
            expect(err.response.data.error).toBeDefined();
            expect(
                _.isEqual(Object.keys({avatar: undefined}), Object.keys(err.response.data.error))
            ).toBe(true);
        }

    })


})

describe('\ndeleteUser', () => {

    beforeAll(async () => {
        await db.connect();
        await db.clearDatabase();
    })
    afterEach(async () => {
        await db.clearDatabase();
    })
    afterAll(async () => {
        await db.closeDatabase();
    })

    it('delete a previus created user', async () => {

        let user = await userService.createUser(preparedUsers[0]);
        let restUser = await axi.delete('user/' + user.id, {
            validateStatus: status => status == 200
        });

        expect(restUser.data.data._id === user.id);

    })

    it('delete a user that has been deleted', async () => {

        let user = await userService.createUser(preparedUsers[0]);
        await axi.delete('user/' + user.id, {
            validateStatus: status => status == 200
        });

        try {
            await axi.delete('user/' + user.id);
        } catch (err) {

            expect(err.response).toBeDefined();
            expect(err.response.status).toBe(500);
            expect(err.response.data.error).toBeDefined();
            expect(err.response.data.error.mainUserNotFound).toBeDefined();

        }

    })

    it('try to delete a user sending invalid mongoId', async () => {
        let user = await userService.createUser(preparedUsers[0]);
        await axi.delete('user/' + user.id + 'hola', { validateStatus: status => status == 400 });
    })

    it('try to delete a user sending data in the body', async () => {


        let user = await userService.createUser(preparedUsers[0]);
        await axi.delete('user/' + user.id, { message: 'This is trash body' }, {
            validateStatus: status => status == 400
        });

    })

    it('try to delete a user sending files in the body', async () => {

        let user = await userService.createUser(preparedUsers[0]);
        let form = new FormData();

        form.append('avatar', fs.createReadStream(path.join(config.uploads, correct.avatars[0])));

        await axi.delete('user/' + user.id, form, {
            validateStatus: status => status == 400
        })

    })

    it('try to delete a user sending a query in the url', async () => {

        let user = await userService.createUser(preparedUsers[0]);
        await axi.delete('user/' + user.id + '?firstName=michael&lastName=jackson', { message: 'This is trash body' }, {
            validateStatus: status => status == 400
        });

    })

})

describe('\ngetUser', () => {

    beforeAll(async () => {
        await db.connect();
        await db.clearDatabase();
    })
    afterEach(async () => {
        await db.clearDatabase();
    })
    afterAll(async () => {
        await db.closeDatabase();
    })

    it('get a user with a valid objectId that exist', async () => {

        try {
            let user = await userService.createUser(preparedUsers[0]);
            let restUser = await axi.get('user/' + user.id);

            expect(user.id === restUser.data.data._id).toBe(true);
            expect(getFields(user)).toMatchObject(getFields(restUser.data.data));
            expect(await bcryptjs.compare(user.password, restUser.data.data.password));


        } catch (err) { console.log(err) };

    })

    it('get a user with a valid objectId that do not exist', async () => {

        try {
            let user = await userService.createUser(preparedUsers[0]);
            await userService.deleteUser(user._id);

            let restUser = await axi.get('user/' + user.id);

        } catch (err) {
            expect(err.response).toBeDefined();
            expect(err.response.status).toBe(500);
            expect(err.response.data.error).toBeDefined();
            expect(err.response.data.error.mainUserNotFound).toBeDefined();
        }

    })

    it('get a user with an invalid string as an objectId', async () => {


        let restUser = await axi.get('user/fdsafdsafda', { validateStatus: status => status == 400 });

    })

})

describe('createUser', () => {

    beforeAll(async () => {
        await db.connect();
        await db.clearDatabase();
    })
    afterEach(async () => {
        await db.clearDatabase();
    })
    afterAll(async () => {
        await db.closeDatabase();
    })

    it('create correctly with valid email, name and password', async () => {

        for (const body of preparedUsers) {

            let res = await axi.post('user', { ...body });
            expect(res.status).toBe(201);
            expect(res.data.data.name).toBe(body.name);
            expect(res.data.data.email).toBe(body.email);
            expect(await bcryptjs.compare(body.password, res.data.data.password)).toBe(true);
        }

    });

    it('create a user with incorrect email', async () => {

        for (const _body of preparedUsers) {
            let body = { ..._body };
            body.email = incorrect.emails[0];

            try {
                let res = await axi.post('user', body);
                throw {};
            } catch (err) {
                expect(err.response).toBeDefined();
                expect(err.response.status).toBe(500);
                expect(err.response.data.error).toBeDefined();
                expect(err.response.data.error.email).toBeDefined();
            }

        }

    })

    it('user with incorrect password', async () => {

        for (const preparedUser of preparedUsers) {
            let user = { ...preparedUser };

            for (const password of incorrect.passwords) {

                user.password = password;

                try {
                    await axi.post('user', user);
                } catch (err) {
                    expect(err.response).toBeDefined();
                    expect(err.response.status).toBe(500);
                    expect(err.response.data.error).toBeDefined();
                    expect(err.response.data.error.password).toBeDefined();
                } finally {
                    await db.clearDatabase();
                }

            }

        }

    })

    it('user with incorrect name', async () => {

        for (const preparedUser of preparedUsers) {
            let user = { ...preparedUser };

            for (const name of incorrect.names) {

                user.name = name;

                try {
                    await axi.post('user', user);
                } catch (err) {
                    expect(err.response).toBeDefined();
                    expect(err.response.status).toBe(500);
                    expect(err.response.data.error).toBeDefined();
                    expect(err.response.data.error.name).toBeDefined();
                } finally {
                    await db.clearDatabase();
                }

            }

        }

    })

    it('user without name, email or password', async () => {

        for (const preparedUser of preparedUsers) {

            for (const key of Object.keys(preparedUser)) {

                let user = { ...preparedUser };
                delete user[key];

                try {
                    await axi.post('user', user);
                } catch (err) {
                    expect(err.response).toBeDefined();
                    expect(err.response.status).toBe(500);
                    expect(err.response.data.error).toBeDefined();
                    expect(err.response.data.error[key]).toBeDefined();
                    expect(Object.keys(err.response.data.error)).toHaveLength(1);
                }
            }

        }

    })

    it('user with correct data but with avatar file in body named !avatar', async () => {

        let user = { ...preparedUsers[0] };

        let formData = new FormData();
        for (let key in user) {
            formData.append(key, user[key]);
        }

        let avatar = correct.avatars[0];
        formData.append('!avatar', fs.createReadStream(path.join(config.uploads, avatar)))

        try {
            await axi.post('user', formData);
        } catch (err) {
            expect(err.response).toBeDefined();
            expect(err.response.status).toBe(400);
        }

    })

    it('user with correct data including avatar', async () => {

        let user = { ...preparedUsers[0] };

        let formData = new FormData();
        for (let key in user) {
            formData.append(key, user[key]);
        }

        let avatar = correct.avatars[0];
        formData.append('avatar', fs.createReadStream(path.join(config.uploads, avatar)))

        let res = await axi.post('user', formData);
        expect(res.status).toBe(201);
        expect(res.data.data.name).toBe(user.name);
        expect(res.data.data.email).toBe(user.email);
        expect(await bcryptjs.compare(user.password, res.data.data.password)).toBe(true);

    })

})

