import { HttpError } from "..";

export function getOrThrow<T, E extends HttpError>(data: T, error: E): T;
