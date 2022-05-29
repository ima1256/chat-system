const protocol = require('./protocol.json');

function getResponse(model, statusCode, ...extra) {
    //console.log(protocol);
    let res = protocol['responseStructure'];
    res.message = protocol[model][statusCode];
    if (statusCode = 200) res.data = extra[0];
    if (statusCode >= 300) res.status = false;
    if (statusCode = 500) res.error = extra[1];
    return res;
}

exports.getResponse = getResponse;