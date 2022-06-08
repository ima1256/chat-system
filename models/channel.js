const mongoose = require('mongoose');

const nameValidators = [
    {
        validator: (value) => /^[A-Za-z].*$/.test(value) && value.length >= 3, msg: 'El nombre debe empezar por una letra'
    },
    {
        validator: (value) => value.length >= 3, msg: 'El nombre debe tener al menos tres simbolos'
    }
]

//Los mensajes del canal no los guardamos en el canal se guarda la referencia de los mismos con el canal en la base de datos
const channelSchema = new mongoose.Schema({
    name: {
        type: String,
        validate: nameValidators,
        required: true
    },
    type: {
        type: String,
        enum: ['server', 'direct'],
        default: 'server',
        required: true
    },
    server: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Server',
        required: true
    }
})

const Channel = mongoose.model('Channel', channelSchema);

module.exports = Channel;