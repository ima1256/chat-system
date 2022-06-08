const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    text: String,   //Text of the message
    files:  {
        type: [Object],
        default: undefined,
        required: function () {
            return this.text === undefined;
        }
    }, 
    type: {
        type: String,
        enum: ['server', 'direct'],
        default: 'server'
    },
    channel: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Channel',
        required: true
    }, 
    user: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'users',
        required: true
    } 
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;