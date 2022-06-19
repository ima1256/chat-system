const protocol = require('./protocol.json');

function getResponse(model, statusCode, ...extra) {
    //console.log(protocol);
    let res = {...protocol['responseStructure']};
    res.message = protocol[model][statusCode];
    if (statusCode == 200 || statusCode == 201) res.data = extra[0];
    //if (statusCode >= 400) res.error = extra[1].errors;
    if (statusCode == 500 || statusCode == 404) res.error = extra[1].errors;
    return res;
}

exports.getResponse = getResponse;