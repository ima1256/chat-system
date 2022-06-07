const bcrypt = require("bcryptjs")
const saltRounds = 10

async function getEncrypted(password) {
    let encrypted;
    let salt = await bcrypt.genSalt(saltRounds);
    encrypted = await bcrypt.hash(password, salt);
    return encrypted;
}

//exports.getEncrypted = getEncrypted;

module.exports.getEncrypted = getEncrypted;