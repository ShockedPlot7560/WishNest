import {DerivedKey} from "../../lib/types";
import jwt from 'jsonwebtoken';
import {derivedKeyFromB64, derivedKeyToB64} from "../../lib/crypto";
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
                        derived_key: await derivedKeyFromB64(decoded.derived_key)
                    });
                }
            }
        });
    });
}

export async function encodeJwt(data: JwtToken) : Promise<string> {
    return new Promise((resolve, reject) => {
        derivedKeyToB64(data.derived_key).then((derivedKey) => {
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