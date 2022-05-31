const mongoose = require('mongoose');
const db = require('./db');
const { saveFile, removeUploads } = require('../utils/files');

const {
  getUser,
  createUser,
  updateUser,
  deleteUser
} = require('./user');

const User = require('../models/user');

const preparedUser = {
  name: 'Imanol Conde',
  email: 'imanolcondeimanol@gmail.com',
  password: 'rh*617/lat'
}

const validUsers = [
  {
    ...preparedUser
  },
  {
    name: 'Kevin',
    email: 'kevin@hotmail.com',
    password: '123dfg9$'
  },
  {
    name: 'Katrin',
    email: 'katrin@ikasle.ehe.eus',
    password: '12df670#'
  }
]

const invalidPassword = '124@dfs';
const invalidPasswords = [invalidPassword, 'sdfdsfdsfsdf@#', 'fdasdaf443'];

const invalidEmail = 'imanol@.com';
const invalidEmails = [invalidEmail, 'dsafsa@gmail.', '@hotmail.com'];

const invalidName = 'f1';
const invalidNames = [invalidName, '1', '12f'];

const invalidAvatarPath = 'sfafdadsd.js';
const invalidAvatarPaths = [invalidAvatarPath, 'holaatodos.pdf', 'safasfads.png'];

const validAvatarPath = 'dadfafdf.jpg';

beforeAll(async () => {
  await db.connect();
  await removeUploads();
})
afterEach(async () => await db.clearDatabase())
afterAll(async () => {
  await removeUploads();
  await db.closeDatabase();
})

describe('createUser', () => {

  it('correct user', async () => {

    let getFields = (({ name, email }) => ({ name, email }));

    for (const preparedUser of validUsers) {
      let user = await createUser({ ...preparedUser });

      expect(getFields(user)).toMatchObject(getFields(preparedUser));
      expect(user.comparePassword(preparedUser.password)).toBe(true);

      Object.keys(User.schema.tree).forEach(function (path) {
        if (!['id', '_id', '__v'].includes(path) && !Object.keys(preparedUser).includes(path))
          expect(user[path]).toBeUndefined();
      });
    }
  })

  it('user with invalid password', async () => {

    let getFields = (({ name, email }) => ({ name, email }));

    //Iteramos cada uno de los usuarios correctos y le ponemos cada una de las contraseñas incorrectas

    for (const invalidPassword of invalidPasswords) {
      for (const validUser of validUsers) {

        //console.log(validUser);

        let user = { ...validUser };
        user.password = invalidPassword;

        try {
          user = await createUser(user);
        } catch (err) {
          expect(err.errors.password).toBeDefined();
          expect(Object.keys(err.errors).length).toBe(1);
        }

      }
    }

  });

  it('user with invalid email', async () => {

    for (const invalidEmail of invalidEmails) {
      for (const validUser of validUsers) {

        let user = { ...validUser };
        user.email = invalidEmail;

        try {
          user = await createUser(user);
        } catch (err) {
          expect(err.errors.email).toBeDefined();
          expect(Object.keys(err.errors).length).toBe(1);
        }

      }
    }

  })

  it('user with invalid name', async () => {

    for (const invalidName of invalidNames) {
      for (const validUser of validUsers) {

        let user = { ...validUser };
        user.name = invalidName;

        try {
          user = await createUser(user);
        } catch (err) {
          expect(err.errors.name).toBeDefined();
          expect(Object.keys(err.errors).length).toBe(1);
        }

      }
    }

  })

  it('introduce a correct user but with avatar path that is not jpg', async () => {

    for (const invalidAvatarPath of invalidAvatarPaths) {
      for (const validUser of validUsers) {

        let user = { ...validUser };
        user.avatar = invalidAvatarPath;

        try {
          user = await createUser(user);
        } catch (err) {
          expect(err.errors.avatar).toBeDefined();
          expect(Object.keys(err.errors).length).toBe(1);
        }

      }
    }

  })

});
