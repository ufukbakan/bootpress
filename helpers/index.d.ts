import { HttpError } from "..";

export function getOrThrow<T, E extends HttpError>(data: T, error: E): T;
export function getOrElse<T, E>(data: T, defaultValue: E): T | E;
