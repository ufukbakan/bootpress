import { Request, Response } from "express";
import { ArraySchema, ErrorTemplateConfiguration, ExtValOf, ExtendedTypeKeys, JsSchema, TypedArraySchema, TypedSchema } from "./helpers";

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

type TypeValueOf<S extends ExtendedTypeKeys | JsSchema | ArraySchema> =
    S extends ExtendedTypeKeys ? ExtValOf<S>
    : S extends JsSchema ? TypedSchema<S>
    : S extends ArraySchema ? TypedArraySchema<S>
    : never;

declare function RestService<T extends Record<PropertyKey, any>>(service: InstanceOrClass<T>): RestedService<T>;
declare function RestMethod<T>(callback: () => T): RequestHandler;
declare function Restify(target: any, key: PropertyKey, desc: PropertyDescriptor): PropertyDescriptor;

declare function PassBody<F extends RequsetHandlerWithLastArg<any>>(serviceFunction: F): ShiftRequestHandler<F>
declare function ParseBodyAs<S extends ExtendedTypeKeys | JsSchema | ArraySchema, T = TypeValueOf<S>>(type: S, config?: ErrorTemplateConfiguration): <F extends RequsetHandlerWithLastArg<T>>(serviceFunction: F) => ShiftRequestHandler<F>
declare function PassBodyAs<S extends ExtendedTypeKeys | JsSchema | ArraySchema, T = TypeValueOf<S>>(type: S, config?: ErrorTemplateConfiguration): <F extends RequsetHandlerWithLastArg<T>>(serviceFunction: F) => ShiftRequestHandler<F>
declare function PassAllParams<F extends RequsetHandlerWithLastArg<string[]>>(serviceFunction: F): ShiftRequestHandler<F>
declare function PassAllQueries<F extends RequsetHandlerWithLastArg<string[]>>(serviceFunction: F): ShiftRequestHandler<F>
declare function PassAllCookies<F extends RequsetHandlerWithLastArg<string[]>>(serviceFunction: F): ShiftRequestHandler<F>
declare function PassParam(paramName: string): <F extends RequsetHandlerWithLastArg<string | undefined>>(serviceFunction: F) => ShiftRequestHandler<F>
declare function PassQuery(queryName: string): <F extends RequsetHandlerWithLastArg<string | undefined>>(serviceFunction: F) => ShiftRequestHandler<F>
declare function PassCookie(cookieName: string): <F extends RequsetHandlerWithLastArg<string | undefined>>(serviceFunction: F) => ShiftRequestHandler<F>
declare function PassRequest<F extends RequsetHandlerWithLastArg<Request>>(serviceFunction: F): ShiftRequestHandler<F>
declare function PassResponse<F extends RequsetHandlerWithLastArg<Response>>(serviceFunction: F): ShiftRequestHandler<F>

export {
    ParseBodyAs, PassAllCookies, PassAllParams, PassAllQueries, PassBody,
    PassBodyAs, PassCookie, PassParam, PassQuery, PassRequest,
    PassResponse, RestMethod, RestService, Restify
};
