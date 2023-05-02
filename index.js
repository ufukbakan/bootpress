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
    const newService = {};
    Object.entries(descriptors).filter(keyvalue => !protectedProperties.includes(keyvalue[0])).forEach(keyvalue => {
        const propertyName = keyvalue[0];
        const value = keyvalue[1].value;
        if (typeof value == "function" && !propertyName.startsWith("#")) {
            newService[propertyName] = ((...args) =>
                (req, res) => {
                    try {
                        const result = service[propertyName](...args);
                        if (result == undefined) {
                            reply(res, 204, null);
                        }
                        else if (result instanceof Promise) {
                            result.then(r => {
                                reply(res, r.status ?? 200, r.data ?? r);
                            }).catch(e => {
                                reply(res, e.status ?? 500, e.message ?? e);
                            })
                        }
                        else {
                            reply(res, result.status ?? 200, result.data ?? result)
                        }
                    } catch (e) {
                        reply(res, e.status ?? 500, e.message ?? e);
                    }
                });
        } else {
            newService[propertyName] = service[propertyName];
        }
    })
    return newService;
}

function RestMethod(callback) {
    return (req, res) => {
        try {
            const result = callback();
            if (result == undefined) {
                reply(res, 204, null);
            }
            else if (result instanceof Promise) {
                result.then(r => {
                    reply(res, r.status ?? 200, r.data ?? r);
                }).catch(e => {
                    reply(res, e.status ?? 500, e.message ?? e);
                })
            } else {
                reply(res, result.status ?? 200, result.data ?? result);
            }
        } catch (e) {
            reply(res, e.status ?? 500, e.message ?? e)
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
                    if (result == undefined) {
                        reply(res, 204, null);
                    }
                    else if (result instanceof Promise) {
                        result.then(r => {
                            reply(res, r.status ?? 200, r.data ?? r);
                        }).catch(e => {
                            reply(res, e.status ?? 500, e.message ?? e);
                        })
                    } else {
                        reply(res, result.status ?? 200, result.data ?? result);
                    }
                } catch (e) {
                    reply(res, e.status ?? 500, e.message ?? e);
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

function PassParam(paramName) {
    return (actualHandler) => {
        return (...args) => {
            if (isRequstHandlerArgs(args)) {
                const req = args.at(-3); const res = args.at(-2);
                const paramToPass = req.params[paramName];
                return actualHandler(paramToPass)(req, res);
            } else {
                return (req, res) => { const paramToPass = req.params[paramName]; actualHandler(...args, paramToPass)(req, res); };
            }
        }
    }
}

function PassQuery(searchQuery) {
    return (actualHandler) => {
        return (...args) => {
            if (isRequstHandlerArgs(args)) {
                const req = args.at(-3); const res = args.at(-2);
                const paramToPass = req.query[searchQuery];
                return actualHandler(paramToPass)(req, res);
            } else {
                return (req, res) => { const paramToPass = req.query[searchQuery]; actualHandler(...args, paramToPass)(req, res); };
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

function PassCookie(cookieName) {
    return (actualHandler) => {
        return (...args) => {
            if (isRequstHandlerArgs(args)) {
                const req = args.at(-3); const res = args.at(-2);
                const cookie = req.cookies[cookieName];
                return actualHandler(cookie)(req, res);
            } else {
                return (req, res) => { const cookie = req.cookies[cookieName]; actualHandler(...args, cookie)(req, res); };
            }
        }
    }
}

module.exports = {
    RestService,
    RestMethod,
    Restify,
    PassParam,
    PassAllParams,
    PassQuery,
    PassAllQueries,
    PassAllCookies,
    PassCookie,
    PassBody,
    PassBodyAs,
    ParseBodyAs,
    PassRequest,
    PassResponse
}