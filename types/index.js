class HttpError extends Error {
    constructor({ status, message }) {
        super(message);
        this.stack += "\n" + message;
        this.message = message || "Internal Bootpress Error";
        this.status = status || 500;
    }
}

class HttpResponse {
    constructor({ status, data, type }) {
        this.status = status || 200;
        this.data = data;
        this.type = type || "application/json";
    }
}

module.exports = {
    HttpError,
    HttpResponse
}