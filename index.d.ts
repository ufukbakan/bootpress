import type { Request, Response, NextFunction } from "express";
import { ArraySchema, ErrorTemplateConfiguration, ExtendedTypeKeys, JsSchema, TypedSchema } from "./helpers";

type RequestHandler = {
  (req: Request, res: Response): void
  (req: Request, res: Response, next: NextFunction): void
}

type FunctionWithArgs<R = any, A extends any[] = any[]> = (...args: A) => R;
type FunctionWithoutArgs<R = any> = () => R;


type RestedService<T extends Record<PropertyKey, any>> = {
  [K in keyof T]:
  T[K] extends Function
  ? (...args: Parameters<T[K]>) => RequestHandler
  : T[K]
}

type InstanceOrClass<T extends Record<PropertyKey, any>> = T | (new () => T);

declare function RouteClass<T extends Record<PropertyKey, any>>(service: InstanceOrClass<T>): RestedService<T>;
declare function Restify(target: any, key: PropertyKey, desc: PropertyDescriptor): PropertyDescriptor;

type ParseBodyArgGetter = {
  (type: ExtendedTypeKeys | JsSchema | TypedSchema<JsSchema> | ArraySchema): RouteBuilder;
  (type: ExtendedTypeKeys | JsSchema | TypedSchema<JsSchema> | ArraySchema, config: ErrorTemplateConfiguration): RouteBuilder;
}

type BodyArgGetter = {
  (): RouteBuilder;
  (type: ExtendedTypeKeys | JsSchema | TypedSchema<JsSchema> | ArraySchema): RouteBuilder;
  (type: ExtendedTypeKeys | JsSchema | TypedSchema<JsSchema> | ArraySchema, config: ErrorTemplateConfiguration): RouteBuilder;
}

type RouteBuilder = {
  param: (name: string) => RouteBuilder;
  params: () => RouteBuilder;
  query: (name: string) => RouteBuilder;
  queries: () => RouteBuilder;
  body: BodyArgGetter;
  parseBody: ParseBodyArgGetter;
  cookie: (name: string) => RouteBuilder;
  cookies: () => RouteBuilder;
  header: (name: string) => RouteBuilder;
  headers: () => RouteBuilder;
  to: (handler: FunctionWithArgs | FunctionWithoutArgs) => RequestHandler;
}
declare function Route(): RouteBuilder;

export {
  Route,
  RouteClass,
  Restify,
};
