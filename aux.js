const mongoose = require('mongoose');
const Message = require('./db/message');
const moment = require('moment');

main = async () => {
    await mongoose.connect('mongodb://localhost:27017/chat-system');

    let messages = await Message.find({ server: 'a server'}).limit(5).exec();
    return messages;
}


main()
.then(messages => {
    messages.forEach(message => {
        let timeStamp = message._id.getTimestamp();
        let date = new Date(timeStamp);
        console.log(moment(date).calendar());
    });
})
.then(() => mongoose.disconnect())
.catch(err => console.log(err)); 

// Requires official Node.js MongoDB Driver 3.0.0+


/*
var mongodb = require("mongodb");

var client = mongodb.MongoClient;
var url = "mongodb://localhost:27017/";

client.connect(url, function (err, client) {
    
    var db = client.db("chat-system");
    var collection = db.collection("messages");
    
    var query = {
        "server": "a server"
    };
    
    var sort = [ ["_id", -1.0] ];
    
    var cursor = collection.find(query).sort(sort).limit(1);
    
    cursor.forEach(
        function(doc) {
            console.log(doc);
            
        }, 
        function(err) {
            client.close();
        }
    );

    console.log(cursor);
    
    // Created with Studio 3T, the IDE for MongoDB - https://studio3t.com/
    
});*/


