const path = require('path');
const fs = require('fs');
const config = require('../config.json');

async function saveFile(file, data = []) {

    //Here we give a unique id with its extension to the file saved in uploads dir
    let savedFileName = getUniqueId() + path.extname(file.name);

    //move photo to uploads directory
    file.mv(path.join(config.uploads, savedFileName));

    //push file details
    data.push({
        name: file.name,
        savedName: savedFileName,
        type: file.mimetype,
        size: file.size
    });

    return data;
}

module.exports.saveFile = saveFile;

module.exports.existFile = function(fileName) {
    return fs.existsSync(path.join(config.uploads, fileName))
}

module.exports.removeUploads = async () => {
    fs.readdir(config.uploads, (err, files) => {
        if (err) throw err;

        for (const file of files) {
            fs.unlink(path.join(config.uploads, file), err => {
                if (err) throw err;
            });
        }
    });
}

function getUniqueId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

exports.saveFile = saveFile;