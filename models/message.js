const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    text: String,   //Text of the message
    files: {
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

const _ = require('lodash-contrib');

function parse(doc, ret, options) {
    //console.log(doc);
    delete ret['__v'];
    delete ret['_id'];
    const id = ret.id;

    delete ret['id'];

    ret = { id, ...ret };

    //Quitamos los path que estan vacios
    let paths = ['files'];
    for (const path of paths) {
        if (!doc[path] || !doc[path].length) delete ret[path];
    }

    return ret;
}

// Ensure virtual fields are serialised.
messageSchema.set('toJSON', {
    virtuals: true
});

// Ensure virtual fields are serialised.
messageSchema.set('toObject', {
    virtuals: true
});


messageSchema.options.toObject.transform = parse;
messageSchema.options.toJSON.transform = parse;

//Static methods
messageSchema.statics.getValidPaths = function () {

    let sPaths = messageSchema.paths;
    delete sPaths['__v'];
    delete sPaths['_id'];
    let body = sPaths.filter(value => value != 'files');
    let files = ['files'];
    return {
        body: body,
        files: files
    }

}

messageSchema.statics.correctKeysBody= (obj) => {
    let paths = Message.getValidPaths();
    return _.keys(obj).every(key => paths.includes(key))
}

//Instance Methods
messageSchema.methods.equals = function (otherMessage) {
    let paths = { ...messageSchema.paths };
    delete paths['__v'];

    
    for (const path of Object.keys(paths)) {
        if (!_.isEqual(this[path], otherMessage[path])) {
            throw { errors: { objectsNotSame: `Messages are not the same in path ${path}\n ${this[path]} \n ${otherMessage[path]}` } }
        }
    }
    return true;
}

messageSchema.methods.sameRequiredFields = function (otherMessage) {
    let paths = { ...messageSchema.requiredPaths() };
    delete paths['__v'];
    delete paths['_id'];
    for (const path of Object.keys(paths)) {
        if (!_.isEqual(this[path], otherMessage[path])) {
            throw { errors: { objectsNotSame: `Objects are not the same in path ${path}\n ${this[path]} \n ${otherMessage[path]}` } }
        }
    }
    return true;
}

messageSchema.methods.sameFields = function (otherMessage) {
    let paths = { ...messageSchema.paths };
    let type = messageSchema.pick(['type']);
    delete paths['__v'];
    delete paths['_id'];
    for (const path of Object.keys(paths)) {
        if (!_.isEqual(this[path], otherMessage[path]) && (!!this[path] || !!this[path])) {
            throw { errors: { objectsNotSame: `Objects are not the same in path ${path}\n ${this[path]} \n ${otherMessage[path]}` } }
        }
    }
    return true;
}

messageSchema.methods.equalsObject = function (otherMessage) {

    let paths = { ...messageSchema.paths };
    delete paths['__v'];
    for (const path of Object.keys(paths)) {
        if ((!_.isEqual(this[path], otherMessage[path]) ||
            (this[path].equals && this[path].equals(otherMessage[path])))
            && otherMessage[path] != undefined) {
            throw { errors: { objectsNotSame: `Objects are not the same in path ${path}\n ${this[path]} \n ${otherMessage[path]}` } }
        }
    }
    return true;

}

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;