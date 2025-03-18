import { decryptGroupUserPrivateKey, decryptGroupUserPublicKey, decryptPrivateData, encryptPrivateData } from "../../lib/crypto";
import { PublicKey, UserPrivateKey } from "../../lib/types";
import { GiftPrivateData, GroupPrivateData } from "../interfaces";
import { DB } from "./db";
import AsyncLock from "async-lock";

export class PrivateDataError extends Error {

}

export async function editPrivateData(
    actualUserUuid: string,
    userPrivateKey: UserPrivateKey,
    familyUuid: string,
    targetUuid: string,
    giftUuid: string,
    callback: (GiftPrivateData) => GiftPrivateData
) {
    const db = await DB;
    const lock = new AsyncLock();

    await lock.acquire(
        familyUuid + targetUuid + giftUuid,
        async () => {
            const encryptedPrivateData: {
                private_data: string
            } = await (await db.prepare(`
                SELECT groups.private_data FROM groups
                    WHERE groups.target_uuid = ? AND groups.family_uuid = ?
            `, [targetUuid, familyUuid])).get();
        
            const encryptedPrivateKey: {
                encryptedPrivateKey: string,
                publicKey: string
            } = await (await db.prepare(`
                SELECT group_user.private_key as encryptedPrivateKey, group_user.public_key as publicKey
                FROM group_user
                    INNER JOIN groups ON groups.uuid = group_user.group_uuid
                WHERE group_user.user_uuid = ? AND groups.family_uuid = ? AND groups.target_uuid = ?
            `, [actualUserUuid, familyUuid, targetUuid])).get();
        
            let privateData: null | GroupPrivateData = null;
            let publicKey: PublicKey | null = null;
            if(encryptedPrivateKey && encryptedPrivateData){
                const privateKey = await decryptGroupUserPrivateKey(encryptedPrivateKey.encryptedPrivateKey, userPrivateKey);
                publicKey = await decryptGroupUserPublicKey(encryptedPrivateKey.publicKey, userPrivateKey);
                privateData = JSON.parse(await decryptPrivateData(encryptedPrivateData.private_data, privateKey));
            }
        
            if(publicKey === null){
                throw new PrivateDataError("No public Key");
            }
        
            if(!privateData){
                throw new PrivateDataError("No private data");
            }
        
            if(!privateData[giftUuid]){
                privateData[giftUuid] = {
                    messages: [],
                    takenBy: null
                };
            }
        
            privateData[giftUuid] = callback(privateData[giftUuid]);
        
            const newPrivateData = await encryptPrivateData(JSON.stringify(privateData), publicKey);
        
            await (await db.prepare(`
                UPDATE groups SET private_data = ? WHERE target_uuid = ? AND family_uuid = ?
            `, [newPrivateData, targetUuid, familyUuid])).
            run();
        }
    )
}