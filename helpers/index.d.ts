import { HttpError } from "..";

type JsSchema = {
    [key: string]: "string" | "boolean" | "number" | JsSchema
}

type TypeMap = {
    "string": string,
    "boolean": boolean,
    "number": number,
}

type SchemadRecord<T> = { [E in keyof T]: T[E] extends string ? TypeMap[T[E]] : SchemadRecord<T[E]> };

export function getOrThrow<T, E extends HttpError>(data: T, error: E): T;
export function getOrElse<T, E>(data: T, defaultValue: E): T | E;
export function asBoolean(o: any): boolean;
export function asNumber(o: any): number;
export function asInteger(o: any): number;
export function asSchema<T extends JsSchema>(o: any, jsSchema: T): SchemadRecord<T>
