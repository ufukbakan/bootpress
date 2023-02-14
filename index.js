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

function RestService(service) {
    // else if a direct object instance:
    let result = {};
    const descriptors = {
        ...Object.getOwnPropertyDescriptors(service),
        ...Object.getOwnPropertyDescriptors(service.prototype)
    };
    const alteredDescriptors = Object.fromEntries(Object.entries(descriptors).map(keyvalue => {
        const propertyName = keyvalue[0];
        const value = keyvalue[1].value;
        if (typeof value == "function" && propertyName != "constructor") {
            return [
                propertyName,
                (...args) =>
                    (req, res) => {
                        try {
                            const result = value(...args);
                            res.status(result.status || 200).json(result.data || result);
                        } catch (e) {
                            res.status(e.status || 500).json(e.message || e);
                        }
                    }
            ]
        } else {
            return keyvalue;
        }
    }));
    Object.defineProperties(result, alteredDescriptors);
    return result;
    // return Object.fromEntries(
    //     Object.entries(service).map(keyvalue => {
    //         if (typeof keyvalue[1] == "function" && keyvalue[0] != "constructor") {
    //             return [
    //                 keyvalue[0],
    //                 (...args) =>
    //                     (req, res) => {
    //                         try {
    //                             const result = keyvalue[1](...args);
    //                             res.status(result.status || 200).json(result.data || result);
    //                         } catch (e) {
    //                             res.status(e.status || 500).json(e.message || e);
    //                         }
    //                     }
    //             ]
    //         } else {
    //             return keyvalue;
    //         }
    //     })
    // );
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
        value: (...args) => {
            return (req, res) => {
                try {
                    const result = oldFunc(...args);
                    res.status(result.status || 200).json(result.data || result);
                    return result;
                } catch (e) {
                    res.status(e.status || 500).json(e.message || e);
                }
            }
        }
    }
}

module.exports = {
    HttpError,
    HttpResponse,
    RestService,
    RestMethod,
    Restify
}