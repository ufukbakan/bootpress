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
    errorMessage = errorMessage ?? `Value ${o} should have been a boolean but it's ${typeof o}`;
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
    errorMessage = errorMessage ?? `Value ${o} should have been a number but it's ${typeof o}`
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
    errorMessage = errorMessage ?? `Value ${o} should have been a integer but it's ${typeof o}`;
    let value = o;
    if (typeof o === "string") {
        value = Number(o);
    }
    if (!Number.isInteger(value)) {
        throw new HttpError(errorStatus, errorMessage);
    }
    return value;
}

function asString(o, errorMessage = undefined, errorStatus = 400) {
    errorMessage = errorMessage ?? `Value ${o} should have been a string but it's not`;
    const validTypes = ["string", "number"];
    if(validTypes.includes(typeof o)){
        return ''+o;
    }else{
        throw new HttpError(errorStatus, errorMessage);
    }
}

function asSchema(o, schema) {
    const schemaKeyValues = Object.entries(schema);
    let result = {};
    for (let i = 0; i < schemaKeyValues.length; i++) {
        let key = schemaKeyValues[i][0];
        if (key.endsWith("?")) {
            key = key.substring(0, key.length - 1);
            if (o[key] == null) {
                result[key] = null;
                continue;
            }
        }
        const expectedType = schemaKeyValues[i][1];
        const errorMessage = o[key] == null ? `Value of ${key} should have been a ${expectedType} but it's null` : `Value of ${key} should have been a ${expectedType} but it's a ${typeof o[key]}`;

        if (typeof expectedType === "object") {
            if (Array.isArray(expectedType)) {
                result[key] = [];
                for(let j = 0; j < o[key].length; j++){
                    result[key][j] = asSchema(o[key][j], expectedType[0])
                }
            } else {
                result[key] = asSchema(o[key], expectedType);
            }
        }
        else if (typeof expectedType === "string") {
            if (typeof o[key] !== expectedType) {
                throw new HttpError(400, errorMessage);
            } else {
                result[key] = o[key];
            }
        }
        else {
            throw new HttpError(500, `Type of a schema key should be a primitive type or another schema`);
        }
    }
    return result;
}


function schema(schema){
    return schema;
}

module.exports = {
    getOrThrow,
    getOrElse,
    asBoolean,
    asNumber,
    asInteger,
    asString,
    asSchema,
    schema
}