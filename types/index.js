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

module.exports = {
    HttpError,
    HttpResponse
}