import { HttpError } from "..";

type TypeMap = {
    "string": string,
    "boolean": boolean,
    "number": number,
}

type ValidTypes = keyof TypeMap;

type StringEndsWithQm = `${string}?`;

type JsSchema = {
    [key: string]: ValidTypes | JsSchema
}

type RemoveQuestionMark<T extends string> = T extends `${infer Prefix}?` ? Prefix : T;

type SchemadRecord<T> = { [E in keyof T as `${RemoveQuestionMark<string & E>}`]: E extends StringEndsWithQm ? (T[E] extends ValidTypes ? TypeMap[T[E]] | null : SchemadRecord<T[E]> | null) : (T[E] extends ValidTypes ? TypeMap[T[E]] : SchemadRecord<T[E]>) };

export function getOrThrow<T, E extends HttpError>(data: T, error: E): T;
export function getOrElse<T, E>(data: T, defaultValue: E): T | E;
export function asBoolean(o: any): boolean;
export function asNumber(o: any): number;
export function asInteger(o: any): number;
export function asSchema<T extends JsSchema>(o: any, jsSchema: T): SchemadRecord<T>;