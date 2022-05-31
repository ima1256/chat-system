const mongoose = require('mongoose');
let validator = require('validator');
const bcrypt = require('bcryptjs');
const passwordComplexity = require("joi-password-complexity");
const fs = require('fs');

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
    validator: (value) => value.split('.').pop() == 'jpg', msg: 'El fichero no se encuentra en el directorio de uploads'
  }
]

const UserSchema = new mongoose.Schema({
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
    validate: (value) => {
      //console.log(value, passwordComplexity(complexityOptions).validate(value));
      return !passwordComplexity(complexityOptions).validate(value).error;
    }
  },
  servers: [mongoose.SchemaTypes.ObjectId],
  friends: [mongoose.SchemaTypes.ObjectId],
  avatar: {
    type: String,
    validate: avatarValidators
  } //This string points to the name of the file in the uploads folder
});

UserSchema.pre("save", function (next) {
  const user = this;

  if (this.isModified("password") || this.isNew) {
    bcrypt.genSalt(10, function (saltError, salt) {
      if (saltError) {
        return next(saltError)
      } else {
        bcrypt.hash(user.password, salt, function (hashError, hash) {
          if (hashError) {
            return next(hashError)
          }

          user.password = hash
          next()
        })
      }
    })
  } else {
    return next()
  }
})

UserSchema.methods.comparePassword = function (password) {
  let match = true;
  bcrypt.compare(password, this.password, function (error, isMatch) {
    if (error || !isMatch) {
      match = false;
    }
  })
  return match;
}

const User = mongoose.model('users', UserSchema);

module.exports = User;