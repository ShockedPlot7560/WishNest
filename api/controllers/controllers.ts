import {Response, Request} from "express";
import {decodeJwt, JwtToken} from "../lib/security";
import * as core from "express-serve-static-core";

type ErrorResponse = {
    error: string
}

export type AuthenticatedRequest<Params = core.ParamsDictionary, ReqBody = object> = Request<Params, object, {
    jwt: JwtToken
} & ReqBody>;

export type BaseResponse<T = object> = Response<T|ErrorResponse>;

export async function authenticated<T>(req: Request, res: BaseResponse<T>, next: () => void) {
    if(!req.headers['authorization']){
        res.status(401).json({error: 'Unauthorized'});
        return;
    }

    const auth = req.headers['authorization'] as string;
    const jwt = await decodeJwt(auth.split(' ')[1]);
    if(jwt === false){
        res.status(401).json({error: 'Unauthorized'});
        return;
    }

    req.body.jwt = jwt;

    next();
}