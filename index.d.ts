import { RequestHandler } from "express"

declare class HttpError extends Error {
    status: number
    message: string
    constructor(status: number, message: string)
}

declare class HttpResponse<T> {
    status: number
    data: T
    constructor(status: number, data: T)
}

type RestedService<T extends Record<string, any>> = { [K in keyof T]:
    T[K] extends Function
    ? (...args: Parameters<T[K]>) => ((req: Request, res: Response) => void)
    : T[K]
}

declare function RestService<T extends Record<string, any>>(clazz: new () => T): RestedService<T>;
declare function RestService<T extends Record<string, any>>(service: T): RestedService<T>;
declare function RestMethod<T>(callback: () => T): RequestHandler;
declare function Restify(target: any, key: string, desc: PropertyDescriptor): PropertyDescriptor;

export {
    HttpError,
    HttpResponse,
    RestService,
    RestMethod,
    Restify
}