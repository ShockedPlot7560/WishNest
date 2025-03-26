import { DerivedKey } from "./crypto";
import jwt from 'jsonwebtoken';
const { verify, sign } = jwt;

export type JwtToken = {
    uuid: string;
    email: string;
    derived_key: DerivedKey;
};

export async function decodeJwt(jwt: string) : Promise<false|JwtToken> {
    return new Promise((resolve, reject) => {
        verify(jwt, 'secret', async (err, decoded) => {
            if(err){
                resolve(false);
            }else{
                if(typeof decoded === 'string'){
                    reject('Invalid token');
                }else{
                    resolve({
                        uuid: decoded.uuid,
                        email: decoded.email,
                        derived_key: await DerivedKey.fromB64(decoded.derived_key)
                    });
                }
            }
        });
    });
}

export async function encodeJwt(data: JwtToken) : Promise<string> {
    return new Promise((resolve, reject) => {
        data.derived_key.toB64().then((derivedKey: string) => {
            sign({
                uuid: data.uuid,
                email: data.email,
                derived_key: derivedKey
            }, 'secret', {expiresIn: '7 days'}, (err, token) => {
                if(err){
                    reject(err);
                }else{
                    resolve(token);
                }
            });
        }).catch(reject);
    });
}