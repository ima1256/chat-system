const mockingoose = require('mockingoose');
const {
    getUser,
    createUser,
    updateUser,
    deleteUser
} = require('./user');
const User = require('../models/user');

describe('User service', () => {
    describe('getUser', () => {
      it ('should return the user with the specified id', async () => {
        mockingoose(User).toReturn([
          {
            name: 'Imanol Conde',
            email: 'imanolcondeimanol@gmail.com',
            password: 'rh*617/lat',
          }
        ], 'find');
        const user = await getUser('628f975a13454456dda9a81b');
        expect(user.name).toBe('Imanol Conde');
      });
    });
  });