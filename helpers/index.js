const { HttpError } = require("../types");

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
    } else if (typeof o === "number"){
        if(o === 1) return true;
        if(o === 0) return false;
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
    if (validTypes.includes(typeof o)) {
        return '' + o;
    } else {
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
                for (let j = 0; j < o[key].length; j++) {
                    result[key][j] = asSchema(o[key][j], expectedType[0])
                }
            } else {
                result[key] = asSchema(o[key], expectedType);
            }
        }
        else if (typeof expectedType === "string") {
            if (expectedType.endsWith("[]")) {
                const elementType = expectedType.replace("[]", "");
                for (let j = 0; j < o[key].length; j++) {
                    if (typeof o[key][j] !== elementType) {
                        throw new HttpError(400, `Each element of ${key} should have been a ${elementType} but a ${typeof o[key][j]} is present (${o[key][j]})`);
                    }
                }
                result[key] = o[key];
            }
            else if (typeof o[key] === expectedType) {
                result[key] = o[key];
            } else {
                throw new HttpError(400, errorMessage);
            }
        }
        else {
            throw new HttpError(500, `Type of a schema key should be a primitive type or another schema`);
        }
    }
    return result;
}


function schema(schema) {
    return schema;
}

function asArrayOf(o, elementType) {
    if (Array.isArray(o)) {
        for (let i = 0; i < o.length; i++) {
            if(typeof o[i] != elementType){
                throw new HttpError(400, `Each element in array should have been a ${elementType} but ${o[i]} is present with type ${typeof o[i]}`);
            }
        }
        return o;
    } else {
        throw new HttpError(400, `Provided object is not an array: ${JSON.stringify(o)}`)
    }
}

function as(o, type) {
    if (typeof type == "string") {
        if (type.endsWith("[]")) {
            // array check
            const elementType = type.replace("[]", "");
            return asArrayOf(o, elementType);
        } else {
            // primitive check
            switch (type) {
                case "string":
                    return asString(o);
                case "number":
                    return asNumber(o);
                case "boolean":
                    return asBoolean(o);
                case "integer":
                    return asInteger(o);
                default:
                    throw new HttpError(500, `Unsupported type ${type}`);
            }
        }
    } else if (typeof type == "object" && type != null) {
        if (Array.isArray(type)) {
            if(type.length > 1){
                throw new HttpError(500, `You can define only one schema for types ArrayOf<Schema>`);
            }else if (type.length < 1){
                throw new HttpError(500, `You must define a schema for types ArrayOf<Schema>`);
            }
            // array schema validation
            if(!Array.isArray(o)){
                throw new HttpError(400, `Provided value should have been an array. (${JSON.stringify(o)})`)
            }
            const providedSchema = type[0];
            for(let i = 0; i < o.length; i++){
                asSchema(o[i], providedSchema);
            }
            return o;
        } else {
            // schema validation
            return asSchema(o, type);
        }
    } else {
        throw new HttpError(500, `Unsupported type check ${type}`)
    }
}

module.exports = {
    getOrThrow,
    getOrElse,
    asBoolean,
    asNumber,
    asInteger,
    asString,
    asSchema,
    schema,
    as
}