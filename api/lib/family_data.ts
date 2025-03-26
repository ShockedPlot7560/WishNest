import { GiftPrivateData, GroupPrivateData } from "../interfaces";
import {prepareAndGet, prepareAndRun} from "./db";
import AsyncLock from "async-lock";
import { logger } from "./logger";
import { GroupUserPublicKey, UserPrivateKey } from "./crypto";

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
    const lock = new AsyncLock();

    logger.debug(`Editing private data for family ${familyUuid} targeting ${targetUuid} gift ${giftUuid} for user ${actualUserUuid}`);

    await lock.acquire(
        familyUuid + targetUuid + giftUuid,
        async () => {
            const encryptedPrivateData: {
                private_data: string
            } | undefined = await prepareAndGet(`
                SELECT groups.private_data FROM groups
                    WHERE groups.target_uuid = ? AND groups.family_uuid = ?
            `, [targetUuid, familyUuid]);
        
            const encryptedPrivateKey: {
                encryptedPrivateKey: string,
                publicKey: string
            } | undefined = await prepareAndGet(`
                SELECT group_user.private_key as encryptedPrivateKey, group_user.public_key as publicKey
                FROM group_user
                    INNER JOIN groups ON groups.uuid = group_user.group_uuid
                WHERE group_user.user_uuid = ? AND groups.family_uuid = ? AND groups.target_uuid = ?
            `, [actualUserUuid, familyUuid, targetUuid]);
        
            let privateData: null | GroupPrivateData = null;
            let publicKey: GroupUserPublicKey | null = null;
            if(encryptedPrivateKey && encryptedPrivateData){
                const privateKey = await userPrivateKey.decryptGroupUserPrivateKey(encryptedPrivateKey.encryptedPrivateKey);
                publicKey = await userPrivateKey.decryptGroupUserPublicKey(encryptedPrivateKey.publicKey);
                privateData = JSON.parse(await privateKey.decode(encryptedPrivateData.private_data));
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
        
            const newPrivateData = await publicKey.encode(JSON.stringify(privateData));
        
            await prepareAndRun(`
                UPDATE groups SET private_data = ? WHERE target_uuid = ? AND family_uuid = ?
            `, [newPrivateData, targetUuid, familyUuid]);
        }
    )
}