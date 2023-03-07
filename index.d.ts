import { Response, Request } from "express"
import { ArraySchema, JsSchema, ValidTypeKeys } from "./helpers"

type RequestHandler = (req: Request, res: Response) => void
type RequsetHandlerWithArgs = (...args: any[]) => RequestHandler

type RestedService<T extends Record<PropertyKey, any>> = { [K in keyof T]:
    T[K] extends Function
    ? (...args: Parameters<T[K]>) => RequestHandler
    : T[K]
}

type InstanceOrClass<T extends Record<PropertyKey, any>> = T | (new () => T);

declare function RestService<T extends Record<PropertyKey, any>>(service: InstanceOrClass<T>): RestedService<T>;
declare function RestMethod<T>(callback: () => T): RequestHandler;
declare function Restify(target: any, key: PropertyKey, desc: PropertyDescriptor): PropertyDescriptor;

declare function PassBody(serviceFunction: RequestHandler | RequsetHandlerWithArgs): RequestHandler
declare function ParseBodyAs(type: ValidTypeKeys | JsSchema | ArraySchema ): (serviceFunction: RequestHandler | RequsetHandlerWithArgs) => RequestHandler
declare function PassBodyAs(type: ValidTypeKeys | JsSchema | ArraySchema ): (serviceFunction: RequestHandler | RequsetHandlerWithArgs) => RequestHandler
declare function PassAllParams(serviceFunction: RequestHandler | RequsetHandlerWithArgs): RequestHandler
declare function PassAllQueries(serviceFunction: RequestHandler | RequsetHandlerWithArgs): RequestHandler
declare function PassAllCookies(serviceFunction: RequestHandler | RequsetHandlerWithArgs): RequestHandler
declare function PassParams(...paramNames: string[]): (serviceFunction: RequestHandler | RequsetHandlerWithArgs) => RequestHandler
declare function PassQueries(...queryNames: string[]): (serviceFunction: RequestHandler | RequsetHandlerWithArgs) => RequestHandler
declare function PassCookies(...cookieNames: string[]): (serviceFunction: RequestHandler | RequsetHandlerWithArgs) => RequestHandler
declare function PassRequest(serviceFunction: RequestHandler | RequsetHandlerWithArgs): RequestHandler
declare function PassResponse(serviceFunction: RequestHandler | RequsetHandlerWithArgs): RequestHandler

export {
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
    PassBodyAs,
    ParseBodyAs,
    PassRequest,
    PassResponse
}