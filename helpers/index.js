const { HttpError } = require("..");

function getOrThrow(data, error) {
    if (data === null || data === undefined) {
        throw error;
    } else {
        return data;
    }
}

function getOrElse(data, defaultValue) {
    if (data === null || data === undefined) {
        return defaultValue;
    } else {
        return data;
    }
}

function asBoolean(o, errorMessage = undefined, errorStatus = 400) {
    errorMessage = errorMessage ?? `Value ${o} should have been a boolean but it is not.`;
    if (typeof o === "string") {
        const lowercased = o.toLowerCase();
        const validBooleanStrings = new Map(Object.entries({
            "true": true,
            "false": false,
            "1": true,
            "0": false,
            "yes": true,
            "no": false
        }));
        if (!validBooleanStrings.has(lowercased)) {
            throw new HttpError(errorStatus, errorMessage);
        }
        return validBooleanStrings.get(lowercased);
    } else if (typeof o === "boolean") {
        return o;
    }
    throw new HttpError(errorStatus, errorMessage);
}

function asNumber(o, errorMessage = undefined, errorStatus = 400) {
    errorMessage = errorMessage ?? `Value ${o} should have been a number but it is not.`
    if (typeof o === "number") {
        return o;
    }
    else if (typeof o === "string") {
        const castedValue = Number(o);
        if (isNaN(castedValue)) {
            throw new HttpError(errorStatus, errorMessage);
        }
    }
    throw new HttpError(errorStatus, errorMessage);
}

function asInteger(o, errorMessage = undefined, errorStatus = 400) {
    errorMessage = errorMessage ?? `Value ${o} should have been a integer but it is not.`;
    let value = o;
    if (typeof o === "string") {
        value = Number(o);
    }
    if (!Number.isInteger(value)) {
        throw new HttpError(errorStatus, errorMessage);
    }
    return value;
}

function asSchema(o, schema){
    const schemaKeyValues = Object.entries(schema);
    for(let i = 0; i < schemaKeyValues.length; i ++){
        const key = schemaKeyValues[i][0];
        const expectedType = schemaKeyValues[i][1];
        if(typeof expectedType === "object"){
            asSchema(o[key], expectedType);
        }else if(typeof expectedType === "string"){
            if(typeof o[key] !== expectedType){
                throw new HttpError(400, `Value of ${key} should have been a ${expectedType} but it is a ${typeof o[key]}`);
            }
        }else {
            throw new HttpError(500, `Type of a schema key should be a primitive type or another schema`);
        }
    }
    return o;
}

module.exports = {
    getOrThrow,
    getOrElse,
    asBoolean,
    asNumber,
    asInteger,
    asSchema
}