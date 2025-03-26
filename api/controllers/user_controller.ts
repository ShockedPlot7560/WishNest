import {Request} from "express";
import {getUserApi} from "../lib/users";
import {checkPassword} from "../lib/login";
import {AuthenticatedRequest, BaseResponse} from "./controllers";
import {encodeJwt} from "../lib/security";
import { logger } from "../lib/logger";

const userApi = getUserApi();

export type GetUsersResponseContent = {
    public_key: string,
    uuid: string, 
    email: string
}

export type GetUsersResponse = BaseResponse<GetUsersResponseContent[]>

export async function get_users(req: AuthenticatedRequest, res: GetUsersResponse) {
    const ret: GetUsersResponseContent[] = [];
    for (const user of await (await userApi).getUsers()) {
        ret.push({
            public_key: await user.public_key.export(),
            uuid: user.uuid,
            email: user.email
        });
    }
    res.json(ret);
}

export type AddUserRequest = Request<object, object, {
    email: string,
    password: string
}>

export type AddUserResponse = BaseResponse<{
    uuid: string,
    email: string
}>

export async function add_user(req: AddUserRequest, res: AddUserResponse) {
    const {email, password} = req.body;

    if(!email || !password){
        res.status(400).json({error: "Bad parameter"});
    }else{
        const userApi = await getUserApi();
        const exist = await userApi.getUserByEmail(email);
        if(exist){
            res.status(400).json({error: "User already exists"});
            return;
        }
        const user = await userApi.createUser(email, password);

        res.json({
            uuid: user.uuid,
            email: user.email
        });
    }
}

export type CheckUserRequest = Request<object, object, {
    email: string,
    password: string
}>

export type CheckUserResponse = BaseResponse<{
    success: boolean,
    uuid: string,
    email: string,
    verified: number,
    derivedKey: string,
    jwt: string
}>;

export async function check_user(req: CheckUserRequest, res: CheckUserResponse){
    const {email, password} = req.body;

    if(!email || !password){
        res.status(400).json({error: "Bad parameter"});
        return;
    }

    try {
        const user = await (await userApi).getUserByEmail(email, password);
        if(user === null){
            res.status(401).json({error: "Login failed"});
            return;
        }

        if(user.verified == 0 && user.verification_code === null){
            await (await getUserApi()).resetVerificationCode(
                user.uuid
            );
        }

        if(!await checkPassword(password, user.password)){
            res.status(401);
            res.json({error: 'Login failed'});
        }else{
            res.json({
                success: true,
                uuid: user.uuid,
                email: user.email,
                verified: user.verified,
                derivedKey: await user.derived_key.toB64(),
                jwt: await encodeJwt({
                    uuid: user.uuid,
                    email: user.email,
                    derived_key: user.derived_key
                })
            })
        }
    } catch {
        res.status(401).json({error: 'Login failed, an error occurred'});
    }
}

export type VerifyUserRequest = Request<object, object, {
    code: string,
    uuid: string
}>

export type VerifyUserResponse = BaseResponse<{
    success: boolean,
    uuid: string,
    email: string
}>

export async function verify_user(req: VerifyUserRequest, res: VerifyUserResponse) {
    const {code, uuid} = req.body;

    if(!code || !uuid){
        res.status(400).json({error: "Bad parameter"});
        return;
    }

    const userApi = await getUserApi();
    const user = await userApi.getUserByUuid(uuid);
    if(user === null){
        res.status(404).json({error: "User not found"});
        return;
    }

    logger.info(user.verification_code + code);

    if(user.verification_code !== code){
        res.status(400).json({error: "Invalid code"});
        return;
    }

    await (await getUserApi()).verifyUser(user.uuid);

    res.json({
        success: true,
        uuid: user.uuid,
        email: user.email
    });
}