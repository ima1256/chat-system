const bcrypt = require("bcryptjs")

const saltRounds = 10

function getEncrypted(password) {
    let encrypted;
    bcrypt.genSalt(saltRounds, function (saltError, salt) {
        if (saltError) {
            throw saltError
        } else {
            bcrypt.hash(password, salt, function (hashError, hash) {
                if (hashError) {
                    throw hashError
                } else {
                    encrypted = hash;
                    console.log(hash)
                    //$2a$10$FEBywZh8u9M0Cec/0mWep.1kXrwKeiWDba6tdKvDfEBjyePJnDT7K
                }
            })
        }
    })
    return encrypted;
}

exports.getEncrypted = getEncrypted;