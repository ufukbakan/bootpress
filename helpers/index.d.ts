import { HttpError } from "../types";

type TypeMap = {
    "string": string,
    "string[]": string[],
    "boolean": boolean,
    "boolean[]": boolean[],
    "number": number,
    "number[]": number[],
    "integer": number,
    "integer[]": number[]
}

type ValidTypeKeys = keyof TypeMap;
type ValOf<T extends ValidTypeKeys> = TypeMap[T]

type StringEndsWithQm = `${string}?`;

type JsSchema = {
    [key: PropertyKey]: ValidTypeKeys | JsSchema | ArraySchema
}

type ArraySchema = [JsSchema]

type RemoveQuestionMark<T extends string> = T extends `${infer Prefix}?` ? Prefix : T;

type TypedSchema<T> = {
    [key in keyof T as `${RemoveQuestionMark<string & key>}`]:
    key extends StringEndsWithQm ? T[key] extends ValidTypeKeys ? ValOf<T[key]> | null : T[key] extends ArraySchema ? TypedSchema<T[key][0]>[] | null : TypedSchema<T[key]> | null
    : (T[key] extends ValidTypeKeys ? ValOf<T[key]> : T[key] extends ArraySchema ? TypedSchema<T[key][0]>[] : TypedSchema<T[key]>)
}

export function getOrThrow<T, K extends NonNullable<T>, E extends HttpError>(data: T, error: E): K;
export function getOrElse<T, E>(data: T, defaultValue: E): E extends NonNullable<infer T> ? E : T | E;
export function schema<T extends JsSchema>(schema: T): T;

type ExtendedTypeMap = {
    "string": string,
    "string[]": string[],
    "boolean": boolean,
    "boolean[]": boolean[],
    "number": number,
    "number[]": number[],
    "integer": number,
    "integer[]": number[],
    "string?": string | null,
    "string[]?": string[] | null,
    "boolean?": boolean | null,
    "boolean[]?": boolean[] | null,
    "number?": number | null,
    "number[]?": number[] | null,
    "integer?": number | null,
    "integer[]?": number[] | null
}

type ExtendedTypeKeys = keyof ExtendedTypeMap;
type ExtValOf<T extends ExtendedTypeKeys> = ExtendedTypeMap[T]
export function as<T extends (ExtendedTypeKeys | JsSchema | ArraySchema)>(o:any, type: T, errorVariableName?: string): T extends ExtendedTypeKeys ? ExtValOf<T> : TypedSchema<T>;
export function asStrict<T extends (ExtendedTypeKeys | JsSchema | ArraySchema)>(o:any, type: T, errorVariableName?: string): T extends ExtendedTypeKeys ? ExtValOf<T> : TypedSchema<T>;