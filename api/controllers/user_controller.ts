import {Request} from "express";
import {derivedKeyToB64, exportUserPublicKey} from "../../lib/crypto";
import {getUserApi} from "../lib/users";
import {checkPassword} from "../../lib/login";
import {AuthenticatedRequest, BaseResponse} from "./controllers";
import {encodeJwt} from "../lib/security";

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
            public_key: await exportUserPublicKey(user.public_key),
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
        const user = await (await userApi).createUser(email, password);

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

        if(!await checkPassword(password, user.password)){
            res.status(401);
            res.json({error: 'Login failed'});
        }else{
            res.json({
                success: true,
                uuid: user.uuid,
                email: user.email,
                derivedKey: await derivedKeyToB64(user.derived_key),
                jwt: await encodeJwt({
                    uuid: user.uuid,
                    email: user.email,
                    derived_key: user.derived_key
                })
            })
        }
    } catch (e) {
        res.status(401).json({error: 'Login failed, an error occurred'});
    }
}