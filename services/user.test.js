const mongoose = require('mongoose');
const db = require('./db');
const { saveFile, removeUploads } = require('../utils/files');

jest.setTimeout(999999);

const {
  getUser,
  createUser,
  updateUser,
  addFriendUser,
  removeFriendUser,
  deleteUser
} = require('./user');

const User = require('../models/user');
const config = require('../config.json');

const validUsers = config.tests.user.prepared;

const invalidPasswords = config.tests.user.incorrect.passwords;

const invalidEmails = config.tests.user.incorrect.emails;

const invalidNames = config.tests.user.incorrect.names;

const invalidAvatarPaths = config.tests.user.incorrect.avatars.incorrect_format;

const validAvatarPaths = config.tests.user.incorrect.avatars.not_found;

const validAndFoundAvatarPaths = config.tests.user.correct.avatars;

let getFields = (({ name, email, avatar }) => {

  if (avatar != undefined) return { name, email, avatar };
  return { name, email };
});

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

  it('get a user with only required fields with an id that exist', async () => {

    for (const preparedUser of validUsers) {

      let user = await createUser(preparedUser);
      user = await getUser(user._id);

      expect(getFields(user)).toMatchObject(getFields(preparedUser));
      expect(user.comparePassword(preparedUser.password)).toBe(true);

      Object.keys(User.schema.tree).forEach(function (path) {
        if (!['id', '_id', '__v'].includes(path) && !Object.keys(preparedUser).includes(path))
          if (path != 'servers' && path != 'friends')
            expect(user[path]).toBeUndefined();
          else
            expect(user[path]).toStrictEqual([]);
      });

    }

  })

})

describe('\ncreateUser', () => {


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

  it('correct user', async () => {

    for (const preparedUser of validUsers) {
      let user = await createUser({ ...preparedUser });

      expect(getFields(user)).toMatchObject(getFields(preparedUser));
      expect(user.comparePassword(preparedUser.password)).toBe(true);

      Object.keys(User.schema.tree).forEach(function (path) {
        if (!['id', '_id', '__v'].includes(path) && !Object.keys(preparedUser).includes(path))
          if (path != 'servers' && path != 'friends')
            expect(user[path]).toBeUndefined();
          else
            expect(user[path]).toStrictEqual([]);
      });
    }
  })

  it('user with invalid password', async () => {

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

  it('introduce a correct user but with avatar path that dont exist', async () => {

    for (const validUser of validUsers) {
      for (const validAvatarPath of validAvatarPaths) {
        let user = { ...validUser };
        user.avatar = validAvatarPath;

        try {
          user = await createUser(user);
        } catch (err) {
          expect(err.errors.avatar).toBeDefined();
          expect(err.errors.avatar.properties.msg).toBe('El fichero no se encuentra en el directorio de uploads');
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
          expect(err.errors.avatar.properties.msg).toBe('El formato no es correcto');
          expect(Object.keys(err.errors).length).toBe(1);
        }

      }
    }

  })

  it("introduce a correct user with valid avatar format and file found", async () => {

    for (const validAndFoundAvatarPath of validAndFoundAvatarPaths) {

      for (const validUser of validUsers) {
        let user;
        user = await createUser({ ...validUser, avatar: validAndFoundAvatarPath });
        expect(getFields(user)).toMatchObject(getFields({ ...validUser, avatar: validAndFoundAvatarPath }));
        expect(user.comparePassword(validUser.password)).toBe(true);

      }

      await db.clearDatabase();

    }

  })

});

//validUsers es un array de usuarios solo con la información requerida
describe('\nupdateUser addFriendUser removeFriendUser addServerUser removeServerUser', () => {

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

  it('update name,email,password,avatar correctly from a user', async () => {

    let createdUsers = [];

    for (const validUser of validUsers) {

      createdUsers.push(await createUser({ ...validUser }));

    }

    //Comprobar que para todas las combinacines de usuarios preparados
    //y campos correctos se actualiza correctamente

    let correct = config.tests.user.correct;
    for (const createdUser of createdUsers) {
      let originalEmail = createdUser.email;
      for (const email of correct.emails) {
        for (const name of correct.names) {
          for (const password of correct.passwords) {
            for (const avatar of correct.avatars) {


              const update = {
                email: email, name: name, password: password, avatar: avatar
              }

              user = await updateUser(createdUser._id, { ...update });

              expect(getFields(user)).toMatchObject(getFields({ ...createdUser, ...update }));
              expect(user.comparePassword(password)).toBe(true);

            }
          }
        }
      }

      await updateUser(createdUser._id, {email: originalEmail});

    }

  })


  it('add a friend to a user', async () => {

    const prepared = config.tests.user.prepared;
    let createdUsers = [];

    for (const user of prepared) createdUsers.push(await createUser({...user}));


   
    for (const i in createdUsers) {

      let user = await getUser(createdUsers[i]._id);

      for (const j in createdUsers) {

        //Aqui es j > i ya que los amigos se hacen dos a dos y sino da error
        if (j > i) {
          
          let friend = await getUser(createdUsers[j]._id);
          const friendFriends = friend.friends.length;
          const userFriends = user.friends.length;
        
          user = await addFriendUser(user._id, friend._id);
          
          //Check user friends array
          await expect(user.friends.filter(value => value.equals(friend._id)).length).toBe(1);
          await expect(user.friends.length).toBe(userFriends + 1);
          
          //Check friend's friends array
          friend = await getUser(friend._id);
          await expect(friend.friends.filter(value => value.equals(user._id)).length).toBe(1);
          await expect(friend.friends.length).toBe(friendFriends + 1);
          
        }

      }
    }

  })

  it.only('remove a friend from a user', async () => {
    const prepared = config.tests.user.prepared;
    let createdUsers = [];

    for (const user of prepared) createdUsers.push(await createUser(user));


    for (const i in createdUsers) {
      
      let user = await getUser(createdUsers[i]._id);

      for (const j in createdUsers) {

        if (i != j) {

          let friend = await getUser(createdUsers[j]._id);
          user = await addFriendUser(user._id, friend._id);
          friend = await getUser(friend._id);

          await expect(user.friends.filter(value => value.equals(friend._id)).length).toBe(1);
          await expect(friend.friends.filter(value => value.equals(user._id)).length).toBe(1);

          user = await removeFriendUser(user._id, friend._id);

          friend = await getUser(friend._id);
          await expect(user.friends.filter(value => value.equals(friend._id)).length).toBe(0);
          await expect(friend.friends.filter(value => value.equals(user._id)).length).toBe(0);

        }
        
      }
    }
  })

  it('add a friend to a user and then remove all friends one by one for each user', async () => {

    const prepared = config.tests.user.prepared;
    let createdUsers = [];

    for (const user of prepared) createdUsers.push(await createUser(user));


    for (const i in createdUsers) {
      
      let user = await getUser(createdUsers[i]._id);
      let added = 0;

      //Añadimos amigos
      for (const j in createdUsers) {

        if (i != j) {
          let friend = await getUser(createdUsers[j]._id);
          user = await addFriendUser(user._id, friend._id);
          added++;

        } 
        
      }

      //Eliminamos todos los amigos de cada usuario creado
      for (const j in createdUsers) {

        if (i != j) {
          let friend = await getUser(createdUsers[j]._id);

          user = await removeFriendUser(user._id, friend._id);
          //User
          await expect(user.friends.filter(value => value.equals(friend._id)).length).toBe(0);
          await expect(user.friends.length).toBe(added - 1);

          //Friend
          friend = await getUser(friend._id);
          await expect(friend.friends.filter(value => value.equals(user._id)).length).toBe(0);
          await expect(friend.friends.length).toBe(added - 1);
          added--;

        }
        
      }

    }

  })

  it('try to add the user as user friend', async () => {

    for (const validUser of validUsers) {
      let user = await createUser({...validUser});
      try {
        await addFriendUser(user._id, user._id);
      } catch (err) {
        expect(err.errors.friends).toBeDefined();
        expect(err.errors.friends.kind).toBe('user defined');
        expect(err.errors).toHaveLength(1);
      }
    }

  })

 

})