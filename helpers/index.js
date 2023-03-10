const { HttpError } = require("../types");

const allowedPrimitives = ["string", "number", "boolean", "integer"];

function getOrThrow(data, error) {
    if (data === null || data === undefined || isEmptyArray(data)) {
        throw error;
    } else {
        return data;
    }
}

function isEmptyArray(x){
    return Array.isArray(x) && x.length < 1;
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
    } else if (typeof o === "number") {
        if (o === 1) return true;
        if (o === 0) return false;
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
    errorMessage = errorMessage ?? `Value ${o} should have been a string but it's ${typeof o}`;
    const validTypes = ["string", "number"];
    if (validTypes.includes(typeof o)) {
        return '' + o;
    } else {
        throw new HttpError(errorStatus, errorMessage);
    }
}

function asSchema(o, schema, strict = false) {
    if(!(schema instanceof Object) || Array.isArray(schema)){
        throw new HttpError(500, `Schema is not valid ${JSON.stringify(schema)}`);
    }
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

        if (typeof expectedType === "object") {
            if (Array.isArray(expectedType)) {
                result[key] = [];
                for (let j = 0; j < o[key].length; j++) {
                    result[key][j] = asSchema(o[key][j], expectedType[0], strict)
                }
            } else {
                result[key] = asSchema(o[key], expectedType, strict);
            }
        }
        else if (typeof expectedType === "string") {
            result[key] = strict ? asStrict(o[key], expectedType, key) : as(o[key], expectedType, key);
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

function asPrimitiveArrayOf(o, elementType) {
    if (Array.isArray(o)) {
        for (let i = 0; i < o.length; i++) {
            o[i] = checkPrimitive(o[i], elementType, "Array elemet");
        }
        return o;
    } else {
        throw new HttpError(400, `Provided object is not an array: ${JSON.stringify(o)}`)
    }
}

function as(o, type, namedErrorVariable = o) {
    if (typeof type === "string") {
        if (type.endsWith("[]")) {
            // array check
            const elementType = type.replace("[]", "");
            return asPrimitiveArrayOf(o, elementType);
        } else { // non array types:
            if (type.endsWith("?") && o == null) {
                return null;
            } else if (type.endsWith("?") && o != null) {
                const actualType = type.replace("?", "");
                return as(o, actualType, namedErrorVariable);
            }
            // primitive check
            switch (type) {
                case "string":
                    return asString(o, `Type of ${namedErrorVariable} should have been a string but it's ${o == null ? "null" : typeof o}`);
                case "number":
                    return asNumber(o, `Type of ${namedErrorVariable} should have been a number but it's ${o == null ? "null" : typeof o}`);
                case "boolean":
                    return asBoolean(o, `Type of ${namedErrorVariable} should have been a boolean but it's ${o == null ? "null" : typeof o}`);
                case "integer":
                    return asInteger(o, `Type of ${namedErrorVariable} should have been an integer but it's ${o == null ? "null" : typeof o}`);
                default:
                    throw new HttpError(500, `Unsupported type ${type}`);
            }
        }
    } else if (typeof type === "object" && type != null) {
        if (Array.isArray(type)) {
            if (type.length > 1) {
                throw new HttpError(500, `You can define only one schema for types ArrayOf<Schema>`);
            } else if (type.length < 1) {
                throw new HttpError(500, `You must define a schema for types ArrayOf<Schema>`);
            }
            // array schema validation
            if (!Array.isArray(o)) {
                throw new HttpError(400, `Provided value should have been an array. (${JSON.stringify(o)})`)
            }
            const providedSchema = type[0];
            let result = [];
            for (let i = 0; i < o.length; i++) {
                result.push(asSchema(o[i], providedSchema));
            }
            return result;
        } else {
            // schema validation
            return asSchema(o, type);
        }
    } else {
        throw new HttpError(500, `Unsupported type check ${type}`)
    }
}

function asStrict(o, type, namedErrorVariable = o) {
    if (typeof type === "string") {
        if (type.endsWith("[]")) {
            // array check
            const elementType = type.replace("[]", "");
            return asPrimitiveArrayOf(o, elementType);
        } else { // non array types:
            if (type.endsWith("?") && o == null) {
                return null;
            } else if (type.endsWith("?") && o != null) {
                const actualType = type.replace("?", "");
                return asStrict(o, actualType, namedErrorVariable);
            }
            // primitive check
            if (!allowedPrimitives.includes(type)) {
                throw new HttpError(500, `Unsupported type ${type}`);
            }
            return checkPrimitive(o, type, namedErrorVariable);
        }
    } else if (typeof type === "object" && type != null) {
        if (Array.isArray(type)) {
            if (type.length > 1) {
                throw new HttpError(500, `You can define only one schema for types ArrayOf<Schema>`);
            } else if (type.length < 1) {
                throw new HttpError(500, `You must define a schema for types ArrayOf<Schema>`);
            }
            // array schema validation
            if (!Array.isArray(o)) {
                throw new HttpError(400, `Provided value should have been an array but it's ${typeof o}`)
            }
            const providedSchema = type[0];
            let result = [];
            for (let i = 0; i < o.length; i++) {
                result.push(asSchema(o[i], providedSchema, true));
            }
            return result;
        } else {
            // schema validation
            return asSchema(o, type, true);
        }
    } else {
        throw new HttpError(500, `Unsupported type check ${type}`)
    }
}

function checkPrimitive(o, type, varName = o) {
    const error = new HttpError(400, `${varName} should have been a ${type}. But it's ${typeof o}`);
    if (type === "integer") {
        if (!Number.isInteger(o)) {
            throw error;
        }
        return o;
    }
    if (typeof o !== type) {
        throw error;
    }
    return o;
}

module.exports = {
    getOrThrow,
    getOrElse,
    schema,
    as,
    asStrict
}