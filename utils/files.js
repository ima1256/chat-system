const path = require('path');
const fs = require('fs');
const config = require('../config.json');
const Jimp = require('jimp');

async function saveFile(file, data = []) {

    //Here we give a unique id with its extension to the file saved in uploads dir
    let savedFileName = getUniqueId();

    if (!isImage(file.name)) savedFileName += path.extname(file.name);
    else {
        if (path.extname(file.name) != '.jpg') {
            let oldFilePath = path.join(config.uploads, savedFileName + path.extname(file.name));
            await file.mv(oldFilePath);
            let oldFile = await Jimp.read(oldFilePath);
            oldFile
            .resize(256, 256) // resize
            .quality(60) // set JPEG quality
            .greyscale() // set greyscale
            .write(path.join(config.uploads, savedFileName + '.jpg')); // save
            fs.unlinkSync(oldFilePath);
        } 
        savedFileName += '.jpg';
    } 

    //move photo to uploads directory
    file.mv(path.join(config.uploads, savedFileName));

    //push file details
    data.push({
        name: file.name,
        savedAs: savedFileName,
        mimeType: file.mimetype,
        size: file.size
    });

    return data;
}

module.exports.deleteFile = async function (filePath) {
    fs.unlinkSync(path.join(config.uploads, filePath));
}

module.exports.saveFile = saveFile;

//Esta function busca en la carpeta uploads haber si existe el fichero nombre fileName
module.exports.existFile = function (fileName) {
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

function isImage(filePath) {
    var allowedExtensions = /.(jpg|jpeg|png|gif)$/i;
    return allowedExtensions.test(path.extname(filePath));
}

function getUniqueId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

exports.saveFile = saveFile;
exports.isImage = isImage