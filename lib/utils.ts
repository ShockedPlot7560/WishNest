import {decryptPrivateKeyUser, deriveKey} from "./crypto";
import {DerivedKey, UserPrivateKey} from "./types";
import {DB} from "../api/lib/db";

export async function getDerivedKeyOfUser(userUuid: string, password: string): Promise<null|DerivedKey> {
    const db = await DB;
    const prepare = await db.prepare(`SELECT salt FROM users WHERE uuid = ?`, [userUuid]);
    const result = await prepare.all();

    if(result.length === 0) {
        return null;
    }

    const salt = result[0].salt;

    return deriveKey(password, salt);
}

export async function getPrivateKeyOfUser(uuid: string, derivedKey: DerivedKey) : Promise<UserPrivateKey> {
    const db = await DB;
    const prepare = await db.prepare(`SELECT private_key FROM users WHERE uuid = ?`, [uuid]);
    const result = await prepare.all();

    if(result.length === 0) {
        return null;
    }

    const privateKey = result[0].private_key;

    return decryptPrivateKeyUser(privateKey, derivedKey);
}