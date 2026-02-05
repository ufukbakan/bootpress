const { as, asStrict, log } = require("./helpers");

const protectedProperties = [
    "toString",
    "toJSON",
    "valueOf",
    "toLocaleString"
]

function reply(/**@type {import("express").Response} */ res, status, data, contentType) {
    if (typeof data === "object") {
        res.status(status).json(data);
    } else {
        res.status(status).contentType(contentType || "text/plain").send(data);
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
        ...Object.getOwnPropertyDescriptors(service.__proto__ || {}),
        ...Object.getOwnPropertyDescriptors(service)
    };
    const newService = {};
    Object.entries(descriptors)
        .filter((keyvalue) => !protectedProperties.includes(keyvalue[0]))
        .forEach((keyvalue) => {
            const propertyName = keyvalue[0];
            const value = keyvalue[1].value;
            if (typeof value == "function" && !propertyName.startsWith("#")) {
                newService[propertyName] = ((...args) =>
                    (_req, res) => {
                        try {
                            const result = service[propertyName](...args);
                            if (result == undefined) {
                                reply(res, 204, null);
                            }
                            else if (result instanceof Promise) {
                                result.then(r => {
                                    if (r == undefined) {
                                        reply(res, 204, null);
                                    } else {
                                        reply(res, r.status ?? 200, r.data ?? r, r.type);
                                    }
                                }).catch(e => {
                                    const status = e.status ?? 500;
                                    status === 500 && log.error(e.stack);
                                    reply(res, status, e.message ?? e);
                                })
                            }
                            else {
                                reply(res, result.status ?? 200, result.data ?? result, result.type)
                            }
                        } catch (e) {
                            const status = e.status ?? 500;
                            status === 500 && log.error(e.stack);
                            reply(res, status, e.message ?? e);
                        }
                    });
            } else {
                newService[propertyName] = service[propertyName];
            }
        })
    return newService;
}

function RestMethod(callback) {
    return callback.length == 0
        ? (req, res) => handle(callback())(req, res)
        : (...args) => handle(callback(...args));
    function handle(result) {
        return (_req, res) => {
            try {
                if (result == undefined) {
                    reply(res, 204, null);
                } else if (result instanceof Promise) {
                    result.then((r) => {
                        if (r == undefined) {
                            reply(res, 204, undefined);
                        } else {
                            reply(res, r.status ?? 200, r.data ?? r);
                        }
                    })
                        .catch((e) => {
                            const status = e.status ?? 500;
                            status === 500 && log.error(e.stack);
                            reply(res, status, e.message ?? e);
                        });
                } else {
                    reply(res, result.status ?? 200, result.data ?? result);
                }
            } catch (e) {
                const status = e.status ?? 500;
                status === 500 && log.error(e.stack);
                reply(res, status, e.message ?? e);
            }
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
                            if (r == undefined) {
                                reply(res, 204, null);
                            } else {
                                reply(res, r.status ?? 200, r.data ?? r);
                            }
                        }).catch(e => {
                            const status = e.status ?? 500;
                            status === 500 && log.error(e.stack);
                            reply(res, status, e.message ?? e);
                        })
                    } else {
                        reply(res, result.status ?? 200, result.data ?? result);
                    }
                } catch (e) {
                    const status = e.status ?? 500;
                    status === 500 && log.error(e.stack);
                    reply(res, status, e.message ?? e);
                }
            }
        }).bind(target)
    }
}

function Needs() {
    const argGetters = [];

    const needs = {
        param(name) {
            argGetters.push((req) => req.params[name]);
            return needs; // Return the object itself
        },
        params() {
            argGetters.push((req) => req.params);
            return needs;
        },
        query(name) {
            argGetters.push((req) => req.query[name]);
            return needs;
        },
        queries() {
            argGetters.push((req) => req.query);
            return needs;
        },
        body(type, config) {
            if (type) {
                argGetters.push((req) => asStrict(req.body || {}, type, config || { messageTemplate: "Malformed Request Body\n{0}" }));
            } else {
                argGetters.push((req) => req.body || {});
            }
            return needs;
        },
        parseBody(type, config) {
            argGetters.push((req) => as(req.body || {}, type, config || { messageTemplate: "Malformed Request Body\n{0}" }));
            return needs;
        },
        cookie(name) {
            argGetters.push((req) => req.cookies[name]);
            return needs;
        },
        cookies() {
            argGetters.push((req) => req.cookies);
            return needs;
        },
        header(name) {
            argGetters.push((req) => req.headers[name]);
            return needs;
        },
        headers() {
            argGetters.push((req) => req.headers);
            return needs;
        },
        request() {
            argGetters.push((req) => req)
            return needs;
        },
        response() {
            argGetters.push((_, res) => res)
            return needs;
        },
        to(callback) {
            return (req, res) => {
                const args = argGetters.map((getter) => getter(req, res));
                return RestMethod(callback)(...args)(req, res);
            };
        }
    };

    return needs;
}

module.exports = {
    RestService,
    RestMethod,
    Restify,
    Needs,
};
