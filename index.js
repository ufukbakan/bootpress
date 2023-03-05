const { as, asStrict } = require("./helpers");
const { HttpError } = require("./types");

const protectedProperties = [
    "toString",
    "toJSON",
    "valueOf",
    "toLocaleString"
]

function reply(res, status, data) {
    if (typeof data == "object") {
        res.status(status).json(data);
    } else {
        res.status(status).send(data);
    }
}

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
                                reply(res, result.status || 200, result.data || result)
                            } catch (e) {
                                reply(res, e.status || 500, e.message || e);
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
            reply(res, result.status || 200, result.data || result);
            return result;
        } catch (e) {
            reply(res, e.status || 500, e.message || e)
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
                    reply(res, result.status || 200, result.data || result);
                    return result;
                } catch (e) {
                    reply(res, e.status || 500, e.message || e);
                }
            }
        }).bind(target)
    }
}


function isResponse(o) {
    return o instanceof Object && "socket" in o && "parser" in o.socket && "_httpMessage" in o.socket && o.socket._httpMessage.writable == true;
}
function isRequest(o) {
    return o instanceof Object && "socket" in o && "url" in o && "body" in o && "params" in o && "query" in o && "res" in o;
}

function isRequstHandlerArgs(args) {
    const [last1, last2, last3, ...others] = [...args].reverse();
    return isResponse(last2) && isRequest(last3);
}

function PassParams(...paramNames) {
    return (actualHandler) => {
        return (...args) => {
            if (isRequstHandlerArgs(args)) {
                const req = args.at(-3); const res = args.at(-2);
                const paramsToPass = paramNames.map(paramName => req.params[paramName]);
                return actualHandler(...paramsToPass)(req, res);
            } else {
                return (req, res) => { const paramsToPass = paramNames.map(paramName => req.params[paramName]); return actualHandler(...args, ...paramsToPass)(req, res); };
            }
        }
    }
}

function PassQueries(...searchQueries) {
    return (actualHandler) => {
        return (...args) => {
            if (isRequstHandlerArgs(args)) {
                const req = args.at(-3); const res = args.at(-2);
                const paramsToPass = searchQueries.map(query => req.query[query]);
                return actualHandler(...paramsToPass)(req, res);
            } else {
                return (req, res) => { const paramsToPass = searchQueries.map(query => req.query[query]); return actualHandler(...args, ...paramsToPass)(req, res); };
            }
        }
    }
}

function PassAllParams(actualHandler) {
    return (...args) => {
        if (isRequstHandlerArgs(args)) {
            const req = args.at(-3); const res = args.at(-2);
            return actualHandler(req.params)(req, res);
        } else {
            return (req, res) => actualHandler(...args, req.params)(req, res);
        }
    }
}

function PassAllQueries(actualHandler) {
    return (...args) => {
        if (isRequstHandlerArgs(args)) {
            const req = args.at(-3); const res = args.at(-2);
            return actualHandler(req.query)(req, res);
        } else {
            return (req, res) => actualHandler(...args, req.query)(req, res);
        }
    }
}

function ParseBodyAs(type) {
    return (actualHandler) => {
        return (...args) => {
            if (isRequstHandlerArgs(args)) {
                const req = args.at(-3); const res = args.at(-2);
                try {
                    return actualHandler(as(req.body, type))(req, res);
                } catch (e) {
                    reply(res, e.status || 500, e.message || e);
                }

            } else {
                return (req, res) => {
                    try {
                        return actualHandler(...args, as(req.body, type))(req, res);
                    } catch (e) {
                        reply(res, e.status || 500, e.message || e)
                    }
                }
            }
        }
    }
}

function PassBodyAs(type) {
    return (actualHandler) => {
        return (...args) => {
            if (isRequstHandlerArgs(args)) {
                const req = args.at(-3); const res = args.at(-2);
                try {
                    return actualHandler(asStrict(req.body, type))(req, res);
                } catch (e) {
                    reply(res, e.status || 500, e.message || e);
                }

            } else {
                return (req, res) => {
                    try {
                        return actualHandler(...args, asStrict(req.body, type))(req, res);
                    } catch (e) {
                        reply(res, e.status || 500, e.message || e)
                    }
                }
            }
        }
    }
}

function PassBody(actualHandler) {
        return (...args) => {
            if (isRequstHandlerArgs(args)) {
                const req = args.at(-3); const res = args.at(-2);
                try {
                    return actualHandler(req.body)(req, res);
                } catch (e) {
                    reply(res, e.status || 500, e.message || e);
                }

            } else {
                return (req, res) => {
                    try {
                        return actualHandler(...args, req.body)(req, res);
                    } catch (e) {
                        reply(res, e.status || 500, e.message || e)
                    }
                }
            }
        }
}

function PassRequest(actualHandler) {
    return (...args) => {
        if (isRequstHandlerArgs(args)) {
            const req = args.at(-3); const res = args.at(-2);
            return actualHandler(req)(req, res);
        } else {
            return (req, res) => actualHandler(...args, req)(req, res)
        }
    }
}

function PassResponse(actualHandler) {
    return (...args) => {
        if (isRequstHandlerArgs(args)) {
            const req = args.at(-3); const res = args.at(-2);
            return actualHandler(res)(req, res);
        } else {
            return (req, res) => actualHandler(...args, res)(req, res)
        }
    }
}

function PassAllCookies(actualHandler) {
    return (...args) => {
        if (isRequstHandlerArgs(args)) {
            const req = args.at(-3); const res = args.at(-2);
            return actualHandler(req.cookies)(req, res);
        } else {
            return (req, res) => actualHandler(...args, req.cookies)(req, res);
        }
    }
}

function PassCookies(...cookieNames) {
    return (actualHandler) => {
        return (...args) => {
            if (isRequstHandlerArgs(args)) {
                const req = args.at(-3); const res = args.at(-2);
                const paramsToPass = cookieNames.map(cookie => req.cookies[cookie]);
                return actualHandler(...paramsToPass)(req, res);
            } else {
                return (req, res) => { const paramsToPass = cookieNames.map(cookie => req.cookies[cookie]); return actualHandler(...args, ...paramsToPass)(req, res) };
            }
        }
    }
}

module.exports = {
    RestService,
    RestMethod,
    Restify,
    PassParams,
    PassAllParams,
    PassQueries,
    PassAllQueries,
    PassAllCookies,
    PassCookies,
    PassBody,
    PassBodyAs,
    ParseBodyAs,
    PassRequest,
    PassResponse
}