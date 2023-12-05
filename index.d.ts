import { Response, Request } from "express"
import { ArraySchema, JsSchema, ValidTypeKeys, TypedSchema, ValOf, TypedArraySchema } from "./helpers"

type RequestHandler = (req: Request, res: Response) => void
type ArrayWithLastElement<L> = [...rest: any[], lastArg: L];
type RequsetHandlerWithLastArg<T, F extends (...args: any) => RequestHandler = (...args: any[]) => RequestHandler, P extends ArrayWithLastElement<T> = Parameters<F>> = (...args: P) => RequestHandler;
type NonEmptyArray = readonly [any, ...any[]];
type ShiftRequestHandler<F extends RequsetHandlerWithLastArg<any> | RequestHandler> =
    F extends (arg1: infer T, ...rest: infer U) => RequestHandler ?
    U extends NonEmptyArray ? (...rest: U) => RequestHandler : RequestHandler
    : RequestHandler

type RestedService<T extends Record<PropertyKey, any>> = {
    [K in keyof T]:
    T[K] extends Function
    ? (...args: Parameters<T[K]>) => RequestHandler
    : T[K]
}

type InstanceOrClass<T extends Record<PropertyKey, any>> = T | (new () => T);

type TypeValueOf<S extends ValidTypeKeys | JsSchema | TypedSchema<any> | ArraySchema> =
    S extends ValidTypeKeys ? ValOf<S>
    : S extends JsSchema ? TypedSchema<S>
    : S extends TypedSchema<any> ? S
    : S extends ArraySchema ? TypedArraySchema<S>
    : never;

declare function RestService<T extends Record<PropertyKey, any>>(service: InstanceOrClass<T>): RestedService<T>;
declare function RestMethod<T>(callback: () => T): RequestHandler;
declare function Restify(target: any, key: PropertyKey, desc: PropertyDescriptor): PropertyDescriptor;

declare function PassBody<F extends RequsetHandlerWithLastArg<any>>(serviceFunction: F): ShiftRequestHandler<F>
declare function ParseBodyAs<S extends ValidTypeKeys | JsSchema | TypedSchema<any> | ArraySchema, T = TypeValueOf<S>>(type: S): <F extends RequsetHandlerWithLastArg<T>>(serviceFunction: F) => ShiftRequestHandler<F>
declare function PassBodyAs<S extends ValidTypeKeys | JsSchema | TypedSchema<any> | ArraySchema, T = TypeValueOf<S>>(type: S): <F extends RequsetHandlerWithLastArg<T>>(serviceFunction: F) => ShiftRequestHandler<F>
declare function PassAllParams<F extends RequsetHandlerWithLastArg<string[]>>(serviceFunction: F): ShiftRequestHandler<F>
declare function PassAllQueries<F extends RequsetHandlerWithLastArg<string[]>>(serviceFunction: F): ShiftRequestHandler<F>
declare function PassAllCookies<F extends RequsetHandlerWithLastArg<string[]>>(serviceFunction: F): ShiftRequestHandler<F>
declare function PassParam(paramName: string): <F extends RequsetHandlerWithLastArg<string | undefined>>(serviceFunction: F) => ShiftRequestHandler<F>
declare function PassQuery(queryName: string): <F extends RequsetHandlerWithLastArg<string | undefined>>(serviceFunction: F) => ShiftRequestHandler<F>
declare function PassCookie(cookieName: string): <F extends RequsetHandlerWithLastArg<string | undefined>>(serviceFunction: F) => ShiftRequestHandler<F>
declare function PassRequest<F extends RequsetHandlerWithLastArg<Request>>(serviceFunction: F): ShiftRequestHandler<F>
declare function PassResponse<F extends RequsetHandlerWithLastArg<Response>>(serviceFunction: F): ShiftRequestHandler<F>

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