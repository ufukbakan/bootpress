class HttpError extends Error {
    status
    message
    constructor(params) {
        super(params.message);
        this.stack += "\n" + params.message;
        this.message = params.message;
        this.status = params.status;
    }
}

class HttpResponse {
    status
    data
    constructor(params) {
        this.status = params.status;
        this.data = params.data;
    }
}

function RestService(service) {
    return Object.fromEntries(
        Object.entries(service).map(keyvalue => {
            if (typeof keyvalue[1] == "function") {
                return [
                    keyvalue[0],
                    (...args) =>
                        (req, res) => {
                            try {
                                const result = keyvalue[1](...args);
                                res.status(result.status || 200).json(result.data || result);
                            } catch (e) {
                                res.status(e.status || 500).json(e.message || e);
                            }
                        }
                ]
            } else {
                return keyvalue;
            }
        })
    );
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

function getOrThrow(data, error){
    if(data === null || data === undefined){
        throw error;
    }else{
        return data;
    }
}

module.exports = {
    HttpError,
    RestService,
    RestMethod,
    Restify,
    getOrThrow
}