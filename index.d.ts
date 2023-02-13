import { RequestHandler } from "express"

class HttpError extends Error {
    status: number
    message: string
    constructor(params: { status: number, message: string }): void;
}

type RestedService<T extends Record<string, any>> = { [K in keyof T]:
    T[K] extends Function
    ? (...args: Parameters<T[K]>) => ((req: Request, res: Response) => void)
    : T[K]
}

function RestService<T extends Record<string, any>>(service: T): RestedService<T>;
function RestMethod<T>(callback: () => T): RequestHandler;
function Restify(target: any, key: string, desc: PropertyDescriptor): PropertyDescriptor;

export {
    HttpError,
    RestService,
    RestMethod,
    Restify
}