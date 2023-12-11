const { HttpError } = require("../types");

const allowedPrimitives = ["string", "number", "boolean", "integer"];
/**
 * For both getter & setter
 * 
 * Any logger with Log4J interface can be usable. (e.g. Pino)
 * 
 */
let _logger = {
    fatal: (message) => console.error(message),
    error: (message) => console.error(message),
    warn: (message) => console.warn(message),
    info: (message) => console.log(message),
    debug: (message) => console.log(message),
    trace: (message) => console.log(message),
};

const log = {
    fatal: (message) => _logger.fatal(message),
    error: (message) => _logger.error(message),
    warn: (message) => _logger.warn(message),
    info: (message) => _logger.info(message),
    debug: (message) => _logger.debug(message),
    trace: (message) => _logger.trace(message),
}

function setLogger(logger) {
    _logger = logger;
}

function passStringArgs(str, ...args) {
    let result = str;
    for (let i = 0; i < args.length; i++) {
        result = str.replace(`{${i}}`, args[i]);
    }
    return result;
}

function getOrThrow(data, error) {
    if (data === null || data === undefined || isEmptyArray(data)) {
        throw error;
    } else {
        return data;
    }
}

function isEmptyArray(x) {
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

function asSchema(o, schema, config = { strict: false, messageTemplate: "{0}" }) {
    const strict = config.strict ?? false;
    if (!(schema instanceof Object) || Array.isArray(schema)) {
        const error = new HttpError(500, `Schema is not valid ${JSON.stringify(schema)}`);
        _logger.error(error.stack);
        throw error;
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
                    result[key][j] = asSchema(o[key][j], expectedType[0], config)
                }
            } else {
                result[key] = asSchema(o[key], expectedType, config);
            }
        }
        else if (typeof expectedType === "string") {
            result[key] = strict ? asStrict(o[key], expectedType, { ...config, errorVariableName: key }) : as(o[key], expectedType, { ...config, errorVariableName: key });
        }
        else {
            const error = new HttpError(500, `Type of a schema key should be a primitive type or another schema`);
            _logger.error(error.stack);
            throw error;
        }
    }
    return result;
}


function schema(schema) {
    return schema;
}

function asPrimitiveArrayOf(o, elementType, config = { errorVariableName: o, messageTemplate: "{0}" }) {
    const messageTemplate = config.messageTemplate ?? "{0}";
    if (Array.isArray(o)) {
        for (let i = 0; i < o.length; i++) {
            o[i] = checkPrimitive(o[i], elementType, config);
        }
        return o;
    } else {
        throw new HttpError(400, passStringArgs(messageTemplate, `Provided object is not an array: ${JSON.stringify(o)}`))
    }
}

function as(o, type, config = { errorVariableName: o, messageTemplate: "{0}" }) {
    const errorVariableName = config.errorVariableName ?? o;
    const messageTemplate = config.messageTemplate ?? "{0}";
    if (typeof type === "string") {
        if (type.endsWith("[]")) {
            // array check
            const elementType = type.replace("[]", "");
            return asPrimitiveArrayOf(o, elementType, config);
        } else { // non array types:
            if (type.endsWith("?") && o == null) {
                return null;
            } else if (type.endsWith("?") && o != null) {
                const actualType = type.replace("?", "");
                return as(o, actualType, config);
            }
            // primitive check
            switch (type) {
                case "string":
                    return asString(o, passStringArgs(messageTemplate, `Type of ${errorVariableName} should have been a string but it's ${o == null ? "null" : typeof o}`));
                case "number":
                    return asNumber(o, passStringArgs(messageTemplate, `Type of ${errorVariableName} should have been a number but it's ${o == null ? "null" : typeof o}`));
                case "boolean":
                    return asBoolean(o, passStringArgs(messageTemplate, `Type of ${errorVariableName} should have been a boolean but it's ${o == null ? "null" : typeof o}`));
                case "integer":
                    return asInteger(o, passStringArgs(messageTemplate, `Type of ${errorVariableName} should have been an integer but it's ${o == null ? "null" : typeof o}`));
                default:
                    const error = new HttpError(500, `Unsupported type ${type}`);
                    _logger.error(error.stack);
                    throw error;
            }
        }
    } else if (typeof type === "object" && type != null) {
        if (Array.isArray(type)) {
            if (type.length > 1) {
                const error = new HttpError(500, `You can define only one schema for types ArrayOf<Schema>`);
                _logger.error(error.stack);
                throw error;
            } else if (type.length < 1) {
                const error = new HttpError(500, `You must define a schema for types ArrayOf<Schema>`);
                _logger.error(error.stack)
                throw error;
            }
            // array schema validation
            if (!Array.isArray(o)) {
                throw new HttpError(400, passStringArgs(messageTemplate, `Provided value should have been an array. (${JSON.stringify(o)})`))
            }
            const providedSchema = type[0];
            let result = [];
            for (let i = 0; i < o.length; i++) {
                result.push(asSchema(o[i], providedSchema, config));
            }
            return result;
        } else {
            // schema validation
            return asSchema(o, type, config);
        }
    } else {
        const error = new HttpError(500, `Unsupported type check ${type}`);
        _logger.error(error);
        throw error;
    }
}

function asStrict(o, type, config = { errorVariableName: o, messageTemplate: "{0}" }) {
    const messageTemplate = config.messageTemplate ?? "{0}";
    if (typeof type === "string") {
        if (type.endsWith("[]")) {
            // array check
            const elementType = type.replace("[]", "");
            return asPrimitiveArrayOf(o, elementType, config);
        } else { // non array types:
            if (type.endsWith("?") && o == null) {
                return null;
            } else if (type.endsWith("?") && o != null) {
                const actualType = type.replace("?", "");
                return asStrict(o, actualType, config);
            }
            // primitive check
            if (!allowedPrimitives.includes(type)) {
                const error = new HttpError(500, `Unsupported type ${type}`);
                _logger.error(error);
                throw error;
            }
            return checkPrimitive(o, type, config);
        }
    } else if (typeof type === "object" && type != null) {
        if (Array.isArray(type)) {
            if (type.length > 1) {
                const error = new HttpError(500, `You can define only one schema for types ArrayOf<Schema>`);
                _logger.error(error);
                throw error;
            } else if (type.length < 1) {
                const error = new HttpError(500, `You must define a schema for types ArrayOf<Schema>`);
                _logger.error(error);
                throw error;
            }
            // array schema validation
            if (!Array.isArray(o)) {
                throw new HttpError(400, passStringArgs(messageTemplate, `Provided value should have been an array but it's ${typeof o}`))
            }
            const providedSchema = type[0];
            let result = [];
            for (let i = 0; i < o.length; i++) {
                result.push(asSchema(o[i], providedSchema, { ...config, strict: true }));
            }
            return result;
        } else {
            // schema validation
            return asSchema(o, type, { ...config, strict: true });
        }
    } else {
        const error = new HttpError(500, `Unsupported type check ${type}`);
        _logger.error(error);
        throw error;
    }
}

function checkPrimitive(o, type, config = { errorVariableName: o, messageTemplate: "{0}" }) {
    const errorVariableName = config.errorVariableName ?? o;
    const messageTemplate = config.messageTemplate ?? "{0}";
    const error = new HttpError(400, passStringArgs(messageTemplate, `${errorVariableName} should have been a ${type}. But it's ${o == null ? "null" : typeof o}`));
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
    asStrict,
    log,
    setLogger
}