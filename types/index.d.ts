declare class HttpError extends Error {
    status: number;
    message: string;
    constructor(opts: { status?: number, message?: string });
}

interface HttpData<T> {
    data: T;
    status?: number;
    type?: string;
}

declare class HttpResponse<T> implements HttpData<T> {
    data: T;
    status: number;
    type: string;
    constructor(HttpData: HttpData<T>);
}

export {
    HttpError,
    HttpResponse
}