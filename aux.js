const axios = require('axios');
const config = require('./config.json');
const db = require('./services/db');
const {saveFile} = require('./utils/files');
const _ = require('lodash-contrib');

async function main() {
    console.log(_.isJSON([]));
}

main().then(newFileName => console.log(newFileName))
.catch(err => console.log(err))