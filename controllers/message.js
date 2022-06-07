const db = require('../services/db');
const _ = require('lodash');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const fileManager = require('../utils/files');

async function saveMessage(req, res) {

    try {

        //Guardamos cuando el mensaje no tiene ficheros
        if (!req.files) {

            await db.saveMessage({ text: req.body.text, files: [] });

            res.send({
                status: true,
                message: 'Your message is saved without files'
            });

        } else {

            let data = [];

            //Cuando el mensaje tiene un unico fichero
            if (req.files.files.constructor !== Array) {
                await fileManager.saveFile(req.files.files, data);
            }
            //Cuando el mensaje tiene multiples ficheros
            else {

                //loop all files
                _.forEach(_.keysIn(req.files.files), (key) => {
                    let file = req.files.files[key];
                    fileManager.saveFile(file, data);
                });
            }

            await db.saveMessage({ text: req.body.text, files: data });

            //return response
            res.send({
                status: true,
                message: 'Message with files saved in db',
                data: data
            });
        }

    } catch (err) {
        console.log(err);
        res.status(500).send(err);
    } finally {
        await db.disconnect();
    }
}

async function getMessages(req, res) {

    try {

        if(!req.body.server) return res.status(401).send({
            status: false, 
            message: 'Please select a server from getting the messages from'
        })

        let messages = await db.getMessages(req.body.server, req.body.numMessages || 15);

        let response = {
            status: true,
            message: 'Your messages are getted',
            data: []
        }

        for (let key in Object.keys(messages)) {
            let message = messages[key];
            response.data.push({
                text: message.text,
                files: message.files,
                user: 'Imanol Conde',
                date: message._id.getTimestamp()
            });
        }

        //Procesamos lo que nos devuelve el servidor para mostrarlo bonito al frontend
        res.json(response);

    } catch (err) {
        console.log(err);
        res.status(500).send(err);
    } finally {
        await db.disconnect();
    }

}

async function getMessage(req,res) {
    res.send({});
}

async function createMessage(req,res) {
    res.send({});
}

async function updateMessage(req,res) {
    res.send({});
}

async function deleteMessage(req,res) {
    res.send({});
}

exports.saveMessage = saveMessage;
exports.getMessages = getMessages;

exports.getMessage = getMessage;
exports.createMessage = createMessage;
exports.updateMessage = updateMessage;
exports.deleteMessage = deleteMessage;