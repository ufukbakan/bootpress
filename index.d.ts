import type { Request, Response, NextFunction } from "express";
import { ArraySchema, ErrorTemplateConfiguration, ExtendedTypeKeys, JsSchema, TypedSchema } from "./helpers";

type RequestHandler = {
    (req: Request, res: Response): void
    (req: Request, res: Response, next: NextFunction): void
}

type FunctionWithArgs<T = any> = (...args: any[]) => T;
type FunctionWithoutArgs<T = any> = () => T;


type RestedService<T extends Record<PropertyKey, any>> = {
    [K in keyof T]:
    T[K] extends Function
    ? (...args: Parameters<T[K]>) => RequestHandler
    : T[K]
}

type InstanceOrClass<T extends Record<PropertyKey, any>> = T | (new () => T);

declare function RestService<T extends Record<PropertyKey, any>>(service: InstanceOrClass<T>): RestedService<T>;
declare function RestMethod<T extends FunctionWithoutArgs>(callback: T): RequestHandler;
declare function RestMethod<T extends FunctionWithArgs>(callback: T): (...args: Parameters<T>) => RequestHandler;
declare function Restify(target: any, key: PropertyKey, desc: PropertyDescriptor): PropertyDescriptor;

type ParseBodyArgGetter = {
    (type: ExtendedTypeKeys | JsSchema | TypedSchema<JsSchema> | ArraySchema): NeedsBuilder;
    (type: ExtendedTypeKeys | JsSchema | TypedSchema<JsSchema> | ArraySchema, config: ErrorTemplateConfiguration): NeedsBuilder;
}

type BodyArgGetter = {
    (): NeedsBuilder;
    (type: ExtendedTypeKeys | JsSchema | TypedSchema<JsSchema> | ArraySchema): NeedsBuilder;
    (type: ExtendedTypeKeys | JsSchema | TypedSchema<JsSchema> | ArraySchema, config: ErrorTemplateConfiguration): NeedsBuilder;
}

type NeedsBuilder = {
    param: (name: string) => NeedsBuilder;
    params: () => NeedsBuilder;
    query: (name: string) => NeedsBuilder;
    queries: () => NeedsBuilder;
    body: BodyArgGetter;
    parseBody: ParseBodyArgGetter;
    cookie: (name: string) => NeedsBuilder;
    cookies: () => NeedsBuilder;
    header: (name: string) => NeedsBuilder;
    headers: () => NeedsBuilder;
    to: (handler: FunctionWithArgs) => RequestHandler;
}
declare function Needs(): NeedsBuilder;

export {
    RestMethod,
    RestService,
    Restify,
    Needs
};

