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

const User = require('../models/user');

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

let ISEValidator = (err) => {
    expect(err.response).toBeDefined();
    expect(err.response.status).toBe(500);
    expect(err.response.data.error).toBeDefined();
}

let NFValidator = (err) => {
    expect(err.response).toBeDefined();
    expect(err.response.status).toBe(404);
    expect(err.response.data.error).toBeDefined();
}

let checkFailFields = (err, flds) => {
    let fields = flds.split(' ');
    expect(err.error).toBeDefined();
    for (let field of fields) {
        expect(err.error[field]).toBeDefined();
    }
    expect(Object.keys(err.error)).toHaveLength(fields.length);
}

let checkUser = async (user, restUser) => {
    expect(user.password == restUser.password || await bcryptjs.compare(user.password, restUser.password)).toBe(true);
    expect(getFields(user)).toMatchObject(getFields(restUser));
    expect(restUser._id).toBe(user.id);
}

const BRValidator = (err) => {

    expect(err.response).toBeDefined();
    expect(err.response.status).toBe(400);
    expect(Object.keys(err.response.data)).toStrictEqual(['message']);

}

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

const mongoose = require('mongoose');
const Server = require('../models/server');
const ObjectId = mongoose.Types.ObjectId;
const userController = require('./user');

describe('\nremoveServer', () => {

    const getRoute = (user, server) => ['user', user.id, 'removeServer', server.id].join('/');

    it('remove a user server to a user that exist', async () => {

        let user = await new User(preparedUsers[0]).save();
        let server = await new Server({ name: 'myServer', creator: user._id }).save();
        await user.addServer(server.id);

        let preUser = (await userController.myFindById(user.id).exec()).toObject();
        let res = await axi.put(getRoute(user, server)); let dbUser = res.data.data;

        expect(res.status).toBe(200);
        expect(res.data.error).toBeUndefined();
        expect(dbUser.servers).toBeUndefined();
        delete preUser.servers;
        expect(_.isEqual(dbUser, preUser)).toBe(true);


    })

    it('remove a server that do not exist to a user that exist', async () => {

        try {
            let user = await User(preparedUsers[0]).save();
            let fakeId = ObjectId().toString();
            let route = getRoute(user, {id: fakeId});
            await axi.put(route);
            throw {};
        } catch (err) {
            NFValidator(err);
            expect(Object.keys(err.response.data.error)).toStrictEqual(['serverNotFound']);
        }

    })

    it('remove a server that exist to a user that do not exist', async () => {

        try {
            let user = await User(preparedUsers[0]).save();
            let server = await Server({ name: 'myserver', creator: user._id }).save();
            await axi.put(getRoute({id: ObjectId().toString()}, server));
            throw {};
        } catch (err) {
            //console.log(err);
            NFValidator(err);
            expect(Object.keys(err.response.data.error)).toStrictEqual(['mainUserNotFound']);
        }

    })

    it('remove a server that do not exist a user that do not exist', async () => {

        try {

            await axi.put(getRoute({id: ObjectId().toString()}, {id: ObjectId().toString()}));
            throw {};
        } catch (err) {
            //console.log(err);
            NFValidator(err);
            expect(Object.keys(err.response.data.error)).toStrictEqual(['mainUserNotFound']);
        }

    })

    it('remove a server to user which is not a server in user servers list', async () => {

        try {
            let user = await User(preparedUsers[0]).save();
            let server = await Server({ name: 'myserver', creator: user._id }).save();
            await axi.put(getRoute(user, server));
            throw {};
        } catch (err) {
            ISEValidator(err);
            expect(Object.keys(err.response.data.error)).toStrictEqual(['serverNot']);
        }

    })

    it('remove multiple servers to a user', async () => {

        let user = await User(preparedUsers[0]).save();
        let server = await Server({ name: 'myserver', creator: user._id }).save();
        let user2 = await User(preparedUsers[1]).save();
        let server2 = await Server({ name: 'myserver2', creator: user2._id }).save();
        await user.addServer(server.id); await user.addServer(server2.id);

        let preUser = (await userController.myFindById(user.id).exec()).toObject();
        await axi.put(getRoute(user, server));
        let res = await axi.put(getRoute(user, server2)); let dbUser = res.data.data;

        expect(dbUser.servers).toBeUndefined();
        delete preUser.servers;
        expect(_.isEqual(dbUser, preUser));

    })

    it('try to remove a server that exist to a user that exist sending data in the body', async () => {

        try {
            let user = await User(preparedUsers[0]).save();
            let server = await Server({ name: 'myserver', creator: user._id }).save();
            await axi.put(getRoute(user, server), {badData: 'Hola que tal'});
            throw {};
        } catch (err) {
            BRValidator(err);
            
        }

    })

    it('try to remove a server that exist to a user that exist sending data in the query', async () => {

        try {
            let user = await User(preparedUsers[0]).save();
            let server = await Server({ name: 'myserver', creator: user._id }).save();
            await axi.put(getRoute(user, server) + '?queryParam=hola');
            throw {};
        } catch (err) {

            BRValidator(err);
            
        }

    })

    it('try to remove a server that exist to a user that exist sending data in file format', async () => {

        try {
            let user = await User(preparedUsers[0]).save();
            let server = await Server({ name: 'myserver', creator: user._id }).save();

            let form = new FormData();

            form.append('avatar', fs.createReadStream(path.join(config.test, incorrect.avatars.incorrect_format[0])));
            await axi.put(getRoute(user, server), form);
            throw {};
        } catch (err) {

            BRValidator(err);
            
        }

    })

    it('try to remove a server that exist to a user that exist sending not mongoId in the params', async () => {
        
        try {
            let user = await User(preparedUsers[0]).save();
            let server = await Server({ name: 'myserver', creator: user._id }).save();
            await axi.put(getRoute({id: 'sddfa'}, server));
        } catch (err) {

            BRValidator(err);
            
        }
        
    })

})

describe('\naddServer', () => {

    const getRoute = (user, server) => ['user', user.id, 'addServer', server.id].join('/');

    let NFValidator = (err) => {
        expect(err.response).toBeDefined();
        expect(err.response.status).toBe(404);
        expect(err.response.data.error).toBeDefined();
    }

    it('add a server that exist in db to a user that exist', async () => {


        let user = await new User(preparedUsers[0]).save();
        let server = await new Server({ name: 'myServer', creator: user._id }).save();

        let preUser = (await userController.myFindById(user.id).exec()).toObject();
        let res = await axi.put(getRoute(user, server)); let dbUser = res.data.data;

        expect(res.status).toBe(200);
        expect(res.data.error).toBeUndefined();
        expect(dbUser.servers).toStrictEqual([{id: server.id, name: server.name}]);
        delete dbUser.servers;
        expect(_.isEqual(dbUser, preUser)).toBe(true);


    })

    it('add a server that do not exist to a user that exist', async () => {

        try {
            let user = await User(preparedUsers[0]).save();
            let fakeId = ObjectId().toString();
            let route = getRoute(user, {id: fakeId});
            await axi.put(route);
        } catch (err) {
            NFValidator(err);
            expect(Object.keys(err.response.data.error)).toStrictEqual(['serverNotFound']);
        }

    })

    it('add a server that exist to a user that do not exist', async () => {

        try {
            let user = await User(preparedUsers[0]).save();
            let server = await Server({ name: 'myserver', creator: user._id }).save();
            await axi.put(getRoute({id: ObjectId().toString()}, server));
        } catch (err) {
            //console.log(err);
            NFValidator(err);
            expect(Object.keys(err.response.data.error)).toStrictEqual(['mainUserNotFound']);
        }

    })

    it('add a server that do not exist a user that do not exist', async () => {

        try {

            await axi.put(getRoute({id: ObjectId().toString()}, {id: ObjectId().toString()}));
        } catch (err) {
            //console.log(err);
            NFValidator(err);
            expect(Object.keys(err.response.data.error)).toStrictEqual(['mainUserNotFound']);
        }

    })

    it('add a server to user which is already a server in user servers list', async () => {

        try {
            let user = await User(preparedUsers[0]).save();
            let server = await Server({ name: 'myserver', creator: user._id }).save();
            await userService.addServer(user.id, server.id);
            await axi.put(getRoute(user, server));
        } catch (err) {

            ISEValidator(err);
            expect(Object.keys(err.response.data.error)).toStrictEqual(['serverAlready']);
        }

    })

    it('add multiple servers to a user', async () => {

        let user = await User(preparedUsers[0]).save();
        let server = await Server({ name: 'myserver', creator: user._id }).save();
        let user2 = await User(preparedUsers[1]).save();
        let server2 = await Server({ name: 'myserver2', creator: user2._id }).save();

        let preUser = (await userController.myFindById(user.id).exec()).toObject();
        await axi.put(getRoute(user, server));
        let res = await axi.put(getRoute(user, server2)); let dbUser = res.data.data;

        expect(dbUser.servers).toStrictEqual([{id: server.id, name: 'myserver'}, {id: server2.id, name: 'myserver2'}]);
        delete dbUser.servers;
        expect(_.isEqual(dbUser, preUser));

    })

    it('try to add a server that exist to a user that exist sending data in the body', async () => {



        try {
            let user = await User(preparedUsers[0]).save();
            let server = await Server({ name: 'myserver', creator: user._id }).save();
            await axi.put(getRoute(user, server), {badData: 'Hola que tal'});
        } catch (err) {

            BRValidator(err);
            
        }

    })

    it('try to add a server that exist to a user that exist sending data in the query', async () => {

        try {
            let user = await User(preparedUsers[0]).save();
            let server = await Server({ name: 'myserver', creator: user._id }).save();
            await axi.put(getRoute(user, server) + '?queryParam=hola');
        } catch (err) {

            BRValidator(err);
            
        }

    })

    it('try to add a server that exist to a user that exist sending data in file format', async () => {

        try {
            let user = await User(preparedUsers[0]).save();
            let server = await Server({ name: 'myserver', creator: user._id }).save();

            let form = new FormData();

            form.append('avatar', fs.createReadStream(path.join(config.test, incorrect.avatars.incorrect_format[0])));
            await axi.put(getRoute(user, server), form);
        } catch (err) {

            BRValidator(err);
            
        }

    })

    it('try to add a server that exist to a user that exist sending not mongoId in the params', async () => {
        
        try {
            let user = await User(preparedUsers[0]).save();
            let server = await Server({ name: 'myserver', creator: user._id }).save();
            await axi.put(getRoute({id: 'sddfa'}, server));
        } catch (err) {

            BRValidator(err);
            
        }
        
    })

})

async function getUser(index) {
    return new User(preparedUsers[index]).save(); 
}

describe('\naddFriend', () => {

    let getRoute = (id, friendId) => ['user', id, 'addFriend', friendId].join('/');
    
    it('add friend to a user sending non mongoId as params', async () => {

       
        let user = await getUser(0);
        axi.put(getRoute(user.id, ObjectId().toString() + 'dfasdfa'))
        .then(res => {throw {}})
        .catch(err => BRValidator(err))
        
    })

    it('add friend to a user sending body in request', async () => {

       
        let user = await getUser(0);
        let friend = await getUser(1);
        axi.put(getRoute(user.id, friend.id), {badBody: 'sdfs'})
        .then(res => {throw {}})
        .catch(err => BRValidator(err))
        
    })

    it('add friend to a user sending query in request', async () => {

       
        let user = await getUser(0);
        let friend = await getUser(1);
        axi.put(getRoute(user.id, friend.id) + '?badQuery=value')
        .then(res => {throw {}})
        .catch(err => BRValidator(err))
        
    })

    it('add friend to a user sending body file in request', async () => {

       
        let user = await getUser(0);
        let friend = await getUser(1);
        let form = new FormData();
        form.append('avatar', fs.createReadStream(path.join(config.test, incorrect.avatars.incorrect_format[0])))
        axi.put(getRoute(user.id, friend.id), form)
        .then(res => {throw {}})
        .catch(err => BRValidator(err))
        
    })

})

describe('\nremoveFriend', () => {

    let getRoute = (id, friendId) => ['user', id, 'removeFriend', friendId].join('/');
    
    it('remove friend to a user sending non mongoId as params', async () => {

       
        let user = await getUser(0);
        axi.put(getRoute(user.id, ObjectId().toString() + 'dfasdfa'))
        .then(res => {throw {}})
        .catch(err => BRValidator(err))
        
    })

    it('remove friend to a user sending body in request', async () => {

       
        let user = await getUser(0);
        let friend = await getUser(1);
        axi.put(getRoute(user.id, friend.id), {badBody: 'sdfs'})
        .then(res => {throw {}})
        .catch(err => BRValidator(err))
        
    })

    it('remove friend to a user sending query in request', async () => {

       
        let user = await getUser(0);
        let friend = await getUser(1);
        axi.put(getRoute(user.id, friend.id) + '?badQuery=value')
        .then(res => {throw {}})
        .catch(err => BRValidator(err))
        
    })

    it('remove friend to a user sending body file in request', async () => {

       
        let user = await getUser(0);
        let friend = await getUser(1);
        let form = new FormData();
        form.append('avatar', fs.createReadStream(path.join(config.test, incorrect.avatars.incorrect_format[0])))
        axi.put(getRoute(user.id, friend.id), form)
        .then(res => {throw {}})
        .catch(err => BRValidator(err))
        
    })

})

describe('\naddFriend', () => {

    let getRoute = (id, friendId) => ['user', id, 'addFriend', friendId].join('/');

    it('add a existing friend to a existing user', async () => {

        let user = await getUser(0);
        let friend = await getUser(1);

        user = await userController.myFindById(user.id).exec(); user = user.toObject();
        let res = await axi.put(getRoute(user.id, friend.id)); let restUser = res.data.data;

        expect(res.status).toBe(200);
        expect(restUser.friends).toStrictEqual([{id: friend.id, name: friend.name, email: friend.email}]);
        delete restUser.friends;
        expect(_.isEqual(user, restUser));


    })

    it('add a friend to a user which is already a friend', async () => {

        try {

            let user = await getUser(0);
            let friend = await getUser(1);
            await user.addFriend(friend.id);
            await axi.put(getRoute(user.id, friend.id));
            throw {}
        } catch (err) {
            ISEValidator(err);
            checkFailFields(err.response.data, 'friendAlready');
        }


    })

    it('add a existing friend to a non existing user', async () => {

        try {

            let friend = await getUser(0);
            await axi.put(getRoute(ObjectId().toString(), friend.id));
            throw {};
        } catch (err) {
            console.log(err);
            NFValidator(err);
            checkFailFields(err.response.data, 'mainUserNotFound');
        }

    })

    it('add non existing friend to a existing user', async () => {

        try {
            let user = await getUser(0);
            await axi.put(getRoute(user.id, ObjectId().toString()));
            throw {};
        } catch (err) {
        
            NFValidator(err);
            checkFailFields(err.response.data, 'friendNotFound');
        }

    })

    it('add non existing friend to a non existing user', async () => {

        try {
            await axi.put(getRoute(ObjectId().toString(), ObjectId().toString()));
            throw {};
        } catch (err) {
           
            NFValidator(err);
            checkFailFields(err.response.data, 'mainUserNotFound');
        }

    })

})

describe('\nremoveFriend', () => {

    let getRoute = (id, friendId) => ['user', id, 'removeFriend', friendId].join('/');

    it('remove a existing friend to a existing user', async () => {

        let user = await getUser(0);
        let friend = await getUser(1);
        await user.addFriend(friend.id);

        user = await userController.myFindById(user.id).exec(); user = user.toObject();
        let res = await axi.put(getRoute(user.id, friend.id)); let restUser = res.data.data;

        expect(res.status).toBe(200);
        expect(restUser.friends).toBeUndefined();
        delete user.friends;
        expect(_.isEqual(user, restUser));


    })

    it('remove a existing friend to a user which is not a friend', async () => {

        try {

            let user = await getUser(0);
            let friend = await getUser(1);
            await axi.put(getRoute(user.id, friend.id));
            throw {}
        } catch (err) {
            ISEValidator(err);
            checkFailFields(err.response.data, 'friendNot');
        }


    })

    it('remove a existing friend to a non existing user', async () => {

        try {

            let friend = await getUser(0);
            await axi.put(getRoute(ObjectId().toString(), friend.id));
            throw {};
        } catch (err) {
            NFValidator(err);
            checkFailFields(err.response.data, 'mainUserNotFound');
        }

    })

    it('remove non existing friend to a existing user', async () => {

        try {
            let user = await getUser(0);
            await axi.put(getRoute(user.id, ObjectId().toString()));
            throw {};
        } catch (err) {
        
            NFValidator(err);
            checkFailFields(err.response.data, 'friendNotFound');
        }

    })

    it('remove non existing friend to a non existing user', async () => {

        try {
            await axi.put(getRoute(ObjectId().toString(), ObjectId().toString()));
            throw {};
        } catch (err) {
           
            NFValidator(err);
            checkFailFields(err.response.data, 'mainUserNotFound');
        }

    })

})

describe('\nupdateUser', () => {


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

    it('avatar of a user correct with .jpg format', async () => {
        let user = await userService.createUser(preparedUsers[1]);
        let form = new FormData();
        form.append('avatar', fs.createReadStream(path.join(config.uploads, correct.avatars[0])));
        let res = await axi.put('user/' + user.id, form);
        expect(res.data.data.avatar).toBeDefined();
        expect(path.extname(res.data.data.avatar)).toBe('.jpg');
        //expect(res.data.data.avatar.mimeType).toBe(path.extname(correct.avatars[0]));
    })

    const fs = require('fs');

    it('avatar of a user correct with .gif format', async () => {
        let user = await userService.createUser(preparedUsers[1]);
        let form = new FormData();
        form.append('avatar', fs.createReadStream(path.join(config.test, 'prueba.gif')));
        let res = await axi.put('user/' + user.id, form);
        expect(res.data.data.avatar).toBeDefined();
        expect(path.extname(res.data.data.avatar)).toBe('.jpg');
        expect(
            fs.existsSync(
                path.join(config.uploads,
                    res.data.data.avatar.split('.').slice(0, -1).join('.') + '.gif')))
        //expect(res.data.data.avatar.mimeType).toBe(path.extname(correct.avatars[0]));
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
        await axi.put('user/' + user.id, form, { validateStatus: status => status == 400 });

    })

    it('invalid avatar format .pdf for avatar field', async () => {

        let user = await userService.createUser(preparedUsers[1]);
        let form = new FormData();
        form.append('avatar', fs.createReadStream(path.join(config.uploads, incorrect.avatars.incorrect_format[0])))

        try {
            await axi.put('user/' + user.id, form);
        } catch (err) {
            //ISEValidator(err);
            expect(err.response).toBeDefined();
            expect(err.response.status).toBe(500);
            console.log(err.response.data);
            expect(err.response.data.error).toBeDefined();
            expect(
                _.isEqual(Object.keys({ avatar: undefined }), Object.keys(err.response.data.error))
            ).toBe(true);
        }

    })


})

describe('\ndeleteUser', () => {

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

describe('\ncreateUser', () => {

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

