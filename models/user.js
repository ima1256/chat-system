const mongoose = require('mongoose');
let validator = require('validator');
const bcrypt = require('bcryptjs');
const passwordComplexity = require("joi-password-complexity");

const { existFile } = require('../utils/files');

const complexityOptions = {
  min: 8,
  max: 26,
  lowerCase: 1,
  //upperCase: 1,
  numeric: 1,
  symbol: 1,
  requirementCount: 4,
}

const avatarValidators = [
  {
    validator: (value) => value.split('.').pop() == 'jpg', msg: 'El formato no es correcto'
  },
  {
    validator: (value) => existFile(value), msg: 'El fichero no se encuentra en el directorio de uploads'
  }
]

var UserSchema = new mongoose.Schema;

UserSchema.add({
  name: {
    type: String,
    required: true,
    validate: (value) => {
      return /^[A-Za-z].*$/.test(value) && value.length >= 3;
    }
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    validate: (value) => {
      return validator.isEmail(value);
    }
  },
  password: {
    type: String,
    required: true,
    //Si hacemos aqui la comprobación de la contraseña mongoose internamente no funciona
    //no es apropiado ya que realmente guardamos la contraseña hasheada que no cumple las condiciones
    validate: (value) => {
      //console.log(value, ' ', this.password, this.name);
      //return !passwordComplexity(complexityOptions).validate(value).error;
      return true;
    }
  },
  servers: {
    type: [{
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Server'
    }]
  },
  friends: {
    type: [{
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'users'
    }],
    validate: (newArray) => {
      if (newArray.length == 0) return true;
      let insertedFriendId = newArray[newArray.length - 1];
      const notRepeated = newArray.find((value, index) => index != newArray.length - 1 && value.equals(insertedFriendId)) === undefined;
      return notRepeated;
    }
  },
  avatar: {
    type: String,
    validate: avatarValidators
  } //This string points to the name of the file in the uploads folder
});

UserSchema.pre('save', { document: true, query: false }, function (next) {
  let user = this;

  // only hash the password if it has been modified (or is new)
  if (!user.isModified('password') && !this.isNew) return next();

  // generate a salt
  bcrypt.genSalt(10, function (err, salt) {
    if (err) return next(err);

    // hash the password using our new salt
    bcrypt.hash(user.password, salt, function (err, hash) {
      if (err) return next(err);
      // override the cleartext password with the hashed one
      user.password = hash;
      next();
    });
  });
});

const Server = require('./server');

const _ = require('lodash');
const config = require('../config.json');

//Virtuals and utils
UserSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

UserSchema.methods.getAvatarUrl = function () {
  return `http://${process.env.HOST}:${process.env.PORT}/${config.routes.avatar}/${this.avatar}`;
}


//Parseation
function parse(doc, ret, options) {
  //console.log(doc);
  delete ret['__v'];
  delete ret['_id'];
  const id = ret.id;

  delete ret['id'];

  ret = { id, ...ret };
  ret.avatar = doc.getAvatarUrl()

  let paths = ['avatar', 'friends', 'servers'];

  for (const path of paths) {
    if (!doc[path] || !doc[path].length) delete ret[path];
  }

  return ret;
}

UserSchema.set('toJSON', { virtuals: true });
UserSchema.set('toObject', { virtuals: true });
UserSchema.options.toObject.transform = parse;
UserSchema.options.toJSON.transform = parse;


//Instance Methods
UserSchema.methods.comparePassword = function (password) {
  let match = true;
  bcrypt.compare(password, this.password, function (error, isMatch) {
    if (error || !isMatch) {
      match = false;
    }
  })
  return match;
}

UserSchema.methods.addServer = async function (id) {

  let user = this;
  let server = await Server.findById(id);

  if (!server) throw { errors: { serverNotFound: 'no se a encontrado el servidor' } };

  if (user.servers.find(serverId => serverId.equals(id))) throw { errors: { serverAlready: 'El servidor esta en la lista de servidores del usuario' } }

  user.servers.push(id);
  user.markModified('servers');
  return await user.save();

}

UserSchema.methods.removeServer = async function (id) {
  let user = this;
  let server = await Server.findById(id);

  if (!server) throw { errors: { serverNotFound: 'no se ha encontrado el servidor' } };

  server = _.remove(user.servers, serverId => serverId.equals(server._id))[0];

  if (!server) throw { errors: { serverNot: 'el servidor no esta en la lista de servidores del usuario' } };

  user.markModified('servers');
  return await user.save();

}

UserSchema.methods.addFriend = async function (id) {
  let user = this;

  let friend = await User.findById(id).exec();

  if (!friend) throw { errors: { friendNotFound: 'the friend do not exist' } }

  if (user.friends.find(friendId => friendId.equals(id))) throw { errors: { friendAlready: 'El amigo esta en la lista de amigos del usuario' } }

  user.friends.push(friend._id);
  user.markModified('friends');
  return await user.save();

}

UserSchema.methods.removeFriend = async function (id) {

  let user = this;

  let friend = await User.findById(id).exec();
  if (!friend) throw { errors: { friendNotFound: 'the friend do not exist' } }

  friend = _.remove(user.friends, id => id.equals(friend._id))[0];

  if (!friend) throw {errors: {friendNot: 'El amigo no esta en la lista de amigos del usuario'}}

  user.markModified('friends');
  return await user.save();

}

UserSchema.methods.equals = function (otherUser) {
  //const difference = _.pickBy(otherServer, (v, k) => !_.isEqual(this[k], v));
  let paths = { ...UserSchema.paths };
  delete paths['__v'];
  for (const path of Object.keys(paths)) {
    if (!_.isEqual(this[path], otherUser[path])) {
      throw { errors: { objectsNotSame: `Objects are not the same in path ${path}\n ${this[path]} \n ${otherUser[path]}` } }
    }
  }
  return true;
  //return Object.keys(difference).every(key => !Object.keys(paths).includes(key));
}

UserSchema.methods.checkPassword = function (password) {
  let error = passwordComplexity(complexityOptions).validate(password).error;
  return error;
}

const { isImage } = require('../utils/files');

UserSchema.methods.checkAvatar = function (avatar) {
  let error = !isImage(avatar) ? new Error('El avatar debe de ser una imagen') : undefined;
  return error;
}

//Static methods
//Este metodo nos devuelve en un json los campos que son requeridos
UserSchema.statics.getRequiredPaths = function () {

  let sPaths = UserSchema.requiredPaths();
  let body = sPaths.filter(value => value != 'avatar');
  let files = ['avatar'];
  return {
    body: body,
    files: files
  }

}

const User = mongoose.model('users', UserSchema);

module.exports = User;