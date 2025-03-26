import { DerivedKey, UserPrivateKey } from "./crypto";
import { prepareAndAll } from "./db";

export async function getPrivateKeyOfUser(uuid: string, derivedKey: DerivedKey) : Promise<UserPrivateKey | null> {
    const result = await prepareAndAll(`SELECT private_key FROM users WHERE uuid = ?`, [uuid]);

    if(result.length === 0) {
        return null;
    }

    return UserPrivateKey.decryptWithDerived(result[0].private_key, derivedKey);
}