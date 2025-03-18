export interface ErrorResponse extends Response {
    error: string
}

export type Response = object;

export interface CreateFamilyResponse extends Response{
    uuid: string,
    name: string
}