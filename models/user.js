const mongoose = require('mongoose');
let validator = require('validator');
const bcrypt = require('bcryptjs');
const passwordComplexity = require("joi-password-complexity");
const Server = require('./server');

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
      type: mongoose.SchemaTypes.ObjectId
    }],
    validate: (newArray) => {
      if (newArray.length == 0) return true;
      let insertedFriendId = newArray[newArray.length-1];
      const notRepeated =   newArray.find((value, index) => index != newArray.length - 1 && value.equals(insertedFriendId)) === undefined;
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

UserSchema.methods.comparePassword = function (password) {
  let match = true;
  bcrypt.compare(password, this.password, function (error, isMatch) {
    if (error || !isMatch) {
      match = false;
    }
  })
  return match;
}

UserSchema.methods.checkPassword = function (password) {
  let error = passwordComplexity(complexityOptions).validate(password).error;
  return error;
}

const {isImage} = require('../utils/files');

UserSchema.methods.checkAvatar = function (avatar) {
  let error = !isImage(avatar) ? new Error('El avatar debe de ser una imagen') : undefined;
  return error;
}

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