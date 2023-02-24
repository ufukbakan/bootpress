import { Response } from "express"
import { Request } from "express"

type RequestHandler = (req: Request, res: Response) => void

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
    ? (...args: Parameters<T[K]>) => RequestHandler
    : T[K]
}

declare function RestService<T extends Record<string, any>>(clazz: new () => T): RestedService<T>;
declare function RestService<T extends Record<string, any>>(service: T): RestedService<T>;
declare function RestMethod<T>(callback: () => T): RequestHandler;
declare function Restify(target: any, key: string, desc: PropertyDescriptor): PropertyDescriptor;

declare function PassParams(...paramNames: string[]): <T extends RequestHandler>(serviceFunction: T) => RequestHandler
declare function PassAllParams<T extends RequestHandler>(serviceFunction: T): RequestHandler
declare function PassQueries(...queryNames: string[]): <T extends RequestHandler>(service: T) => RequestHandler
declare function PassAllQueries<T extends RequestHandler>(serviceFunction: T): RequestHandler
declare function PassCookies(...cookieNames: string[]): <T extends RequestHandler>(service: T) => RequestHandler
declare function PassAllCookies<T extends RequestHandler>(serviceFunction: T): RequestHandler
declare function PassBody<T extends RequestHandler>(serviceFunction: T): RequestHandler
declare function PassRequest<T extends RequestHandler>(serviceFunction: T): RequestHandler

export {
    HttpError,
    HttpResponse,
    RestService,
    RestMethod,
    Restify,
    PassParams,
    PassAllParams,
    PassQueries,
    PassAllQueries,
    PassCookies,
    PassAllCookies,
    PassBody,
    PassRequest
}