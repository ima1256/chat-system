const mongoose = require('mongoose');

//Los comandos son como los mensajes se obtienen de la base de datos, no vienen con el servidor en si 
const commandSchema = new mongoose.Schema({
    name: {
        type: String,
        validate: value => /^[a-z]*$/.test(value),
        required: true
    },
    parameters: {
        type: [String],
        lowercase: true
    },
    server: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Server',
        required: true
    }
})

const serverCommand = mongoose.model('ServerCommand', commandSchema);

module.exports = serverCommand;