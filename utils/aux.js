const db = require('../db/db');

async function main() {
    let usr = {
        'name': 'Imanol Conde ',
        'email': 'imanolcondeimfanol@gmail.com',
        'password': 'rh*617/lat'
    };
    
    await db.connect();
    await db.createUser(usr);
    await db.disconnect();
}

main();



  
