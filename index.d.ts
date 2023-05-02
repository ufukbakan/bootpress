import { Response, Request } from "express"
import { ArraySchema, JsSchema, ValidTypeKeys, TypedSchema } from "./helpers"

type RequestHandler = (req: Request, res: Response) => void
type RequsetHandlerWithArgs = <A extends any[]>(...args: A) => RequestHandler
type RequsetHandlerWithFirstArg<T> = (arg1: T, ...rest: any[]) => RequestHandler
type NonEmptyArray = readonly [any, ...any[]];
type ShiftRequestHandler<F extends (arg1: any, ...rest: any[]) => RequestHandler> = F extends (arg1: infer T, ...rest: infer U) => RequestHandler ? U extends NonEmptyArray ? (...rest: U) => RequestHandler : RequestHandler : RequestHandler

type RestedService<T extends Record<PropertyKey, any>> = { [K in keyof T]:
    T[K] extends Function
    ? (...args: Parameters<T[K]>) => RequestHandler
    : T[K]
}

type InstanceOrClass<T extends Record<PropertyKey, any>> = T | (new () => T);

declare function RestService<T extends Record<PropertyKey, any>>(service: InstanceOrClass<T>): RestedService<T>;
declare function RestMethod<T>(callback: () => T): RequestHandler;
declare function Restify(target: any, key: PropertyKey, desc: PropertyDescriptor): PropertyDescriptor;

declare function PassBody<F extends RequsetHandlerWithFirstArg<any>>(serviceFunction: F): ShiftRequestHandler<F>
declare function ParseBodyAs<T extends ValidTypeKeys | JsSchema | TypedSchema<any> | ArraySchema, F extends RequsetHandlerWithFirstArg<T>>(type: T): (serviceFunction: F) => ShiftRequestHandler<F>
declare function PassBodyAs<T extends ValidTypeKeys | JsSchema | TypedSchema<any> | ArraySchema, F extends RequsetHandlerWithFirstArg<T>>(type: T): (serviceFunction: F) => ShiftRequestHandler<F>
declare function PassAllParams<F extends RequsetHandlerWithFirstArg<string[]>>(serviceFunction: F): ShiftRequestHandler<F>
declare function PassAllQueries<F extends RequsetHandlerWithFirstArg<string[]>>(serviceFunction: F): ShiftRequestHandler<F>
declare function PassAllCookies<F extends RequsetHandlerWithFirstArg<string[]>>(serviceFunction: F): ShiftRequestHandler<F>
declare function PassParam<F extends RequsetHandlerWithFirstArg<string | undefined>>(paramName: string): (serviceFunction: F) => ShiftRequestHandler<F>
declare function PassQuery<F extends RequsetHandlerWithFirstArg<string | undefined>>(queryName: string): (serviceFunction: F) => ShiftRequestHandler<F>
declare function PassCookie<F extends RequsetHandlerWithFirstArg<string | undefined>>(cookieName: string): (serviceFunction: F) => ShiftRequestHandler<F>
declare function PassRequest<F extends RequsetHandlerWithFirstArg<Request>>(serviceFunction: F): ShiftRequestHandler<F>
declare function PassResponse<F extends RequsetHandlerWithFirstArg<Response>>(serviceFunction: F): ShiftRequestHandler<F>

export {
    RestService,
    RestMethod,
    Restify,
    PassParam,
    PassAllParams,
    PassQuery,
    PassAllQueries,
    PassCookie,
    PassAllCookies,
    PassBody,
    PassBodyAs,
    ParseBodyAs,
    PassRequest,
    PassResponse
}