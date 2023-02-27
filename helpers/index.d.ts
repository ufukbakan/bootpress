import { HttpError } from "..";

type TypeMap = {
    "string": string,
    "boolean": boolean,
    "number": number,
}

type ValidTypes = keyof TypeMap;
type ValOf<T extends keyof TypeMap> = TypeMap[T]

type StringEndsWithQm = `${string}?`;

type JsSchema = {
    [key: PropertyKey]: ValidTypes | JsSchema
}

type RemoveQuestionMark<T extends string> = T extends `${infer Prefix}?` ? Prefix : T;

type TypedSchema<T> = {
    [key in keyof T as `${RemoveQuestionMark<string & key>}`]:
    key extends StringEndsWithQm ? T[key] extends ValidTypes ? ValOf<T[key]> | null : TypedSchema<T[key]> | null
    : (T[key] extends ValidTypes ? ValOf<T[key]> : TypedSchema<T[key]>)
}

export function getOrThrow<T, E extends HttpError>(data: T, error: E): T;
export function getOrElse<T, E>(data: T, defaultValue: E): T | E;
export function asBoolean(o: any): boolean;
export function asNumber(o: any): number;
export function asInteger(o: any): number;
export function asSchema<T extends JsSchema>(o: any, jsSchema: T): TypedSchema<T>;
export function schema<T extends JsSchema>(schema: T): T;