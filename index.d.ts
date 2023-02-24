import { Response } from "express"
import { Request } from "express"

type RequestHandler = (req: Request, res: Response) => void
type RequestHandlerWithArgs<T> = (...args: T) => RequestHandler

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

declare function PassParams(...paramNames: string[]): <T, Z>(handler: RequestHandlerWithArgs<T>) => (argHandler: Z) => Z extends RequestHandler ? void : RequestHandler
declare function PassAllParams<T>(serviceFunction: T): <Z>(argHandler: Z) => Z extends RequestHandler ? void : RequestHandler
declare function PassQueries(...queryNames: string[]): <T>(service: T) => <T, Z>(handler: RequestHandlerWithArgs<T>) => (argHandler: Z) => Z extends RequestHandler ? void : RequestHandler
declare function PassAllQueries<T>(serviceFunction: T): <Z>(...args: Z) => Z extends Parameters<RequestHandler> ? RequestHandler : RequestHandlerWithArgs<Z>
declare function PassCookies(...cookieNames: string[]): <T>(service: T) => <T, Z>(handler: RequestHandlerWithArgs<T>) => (argHandler: Z) => Z extends RequestHandler ? void : RequestHandler
declare function PassAllCookies<T>(serviceFunction: T): <Z>(...args: Z) => Z extends Parameters<RequestHandler> ? RequestHandler : RequestHandlerWithArgs<Z>
declare function PassBody<T>(serviceFunction: T): <Z>(...args: Z) => Z extends Parameters<RequestHandler> ? RequestHandler : RequestHandlerWithArgs<Z>
declare function PassRequest<T>(serviceFunction: T): <Z>(...args: Z) => Z extends Parameters<RequestHandler> ? RequestHandler : RequestHandlerWithArgs<Z>

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