const axios = require('axios');
const config = require('./config.json');
const db = require('./services/db');

const requestValidators = {
    createUser: [
        {
            validator: (req) => Object.keys(req.body).every(val => { return keys.includes(val) })
        },
        {
            validator: (req) => Object.keys(req.files).every(val => { return fileKeys.includes(val) }) || _.isEqual(req.files, {})
        }
    ]
}

const keys = ['name', 'email', 'password'];
const fileKeys = ['avatar'];

async function main() {

    try {

        //await db.connect();
        //await db.clearDatabase();

        //requestValidators.createUser.every(elem => elem.validator(req))

        const axiosConfig = {
            headers: {
                'Content-Type': 'application/json;charset=UTF-8',
                "Access-Control-Allow-Origin": "*",
            }
        };

        let res = await axios.post('http://localhost:3000' + '/user',
            config.tests.user.prepared[0], axiosConfig
        );

    } catch (err) {
        console.log(err);
    }


}

main().then(() => null)