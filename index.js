class HttpError extends Error {
    constructor(status, message) {
        super(message);
        this.stack += "\n" + message;
        this.message = message;
        this.status = status;
    }
}

class HttpResponse {
    constructor(status, data) {
        this.status = status;
        this.data = data;
    }
}

const protectedProperties = [
    "toString",
    "toJSON",
    "valueOf",
    "toLocaleString"
]

function RestService(service) {
    if (typeof service == "function") {
        try {
            service = service();
        } catch (e) {
            service = new service();
        }
    }
    const descriptors = {
        ...Object.getOwnPropertyDescriptors(service),
        ...Object.getOwnPropertyDescriptors(service.__proto__ || {})
    };
    const alteredDescriptors = Object.fromEntries(Object.entries(descriptors).filter(keyvalue => !protectedProperties.includes(keyvalue[0])).map(keyvalue => {
        const propertyName = keyvalue[0];
        const value = keyvalue[1].value;
        if (typeof value == "function" && !propertyName.startsWith("#")) {
            return [
                propertyName,
                {
                    value: ((...args) =>
                        (req, res) => {
                            try {
                                const result = value.bind(service)(...args);
                                if (result === undefined) {
                                    throw new HttpError(200, "Your method is executed but it returned undefined. Please avoid using 'void' methods as service methods.");
                                } else if (result === null) {
                                    throw new HttpError(200, "Your method is executed but it returned null. At least a value is expected to be returned.");
                                }
                                res.status(result.status || 200).json(result.data || result);
                            } catch (e) {
                                res.status(e.status || 500).send(e.message || e);
                            }
                        }),
                    configurable: keyvalue[1].configurable,
                    writable: keyvalue[1].writable,
                    enumerable: false
                }
            ]
        } else {
            return keyvalue;
        }
    }));
    Object.defineProperties(service, alteredDescriptors);
    return service;
}

function RestMethod(callback) {
    return (req, res) => {
        try {
            const result = callback();
            res.status(result.status || 200).json(result.data || result);
            return result;
        } catch (e) {
            res.status(e.status || 500).json(e.message || e);
        }
    }
}

function Restify(target, key, desc) {
    const oldFunc = desc.value;
    return {
        ...desc,
        value: ((...args) => {
            return (req, res) => {
                try {
                    const result = oldFunc(...args);
                    res.status(result.status || 200).json(result.data || result);
                    return result;
                } catch (e) {
                    res.status(e.status || 500).json(e.message || e);
                }
            }
        }).bind(target)
    }
}

module.exports = {
    HttpError,
    HttpResponse,
    RestService,
    RestMethod,
    Restify
}