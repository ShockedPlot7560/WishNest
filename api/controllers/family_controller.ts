import {GiftPrivateData, InternalFamily} from "../interfaces";
import {AuthenticatedRequest, BaseResponse} from "./controllers";
import {DB, prepareAndAll} from "../lib/db";
import {uuid} from "uuidv4";
import {decryptGroupUserPrivateKey, decryptPrivateData} from "../../lib/crypto";
import {getPrivateKeyOfUser} from "../../lib/utils";
import { editPrivateData } from "../lib/family_data";

export type GetFamiliesRequest = AuthenticatedRequest<{
    uuid: string
}>;

export type GetFamiliesResponse = BaseResponse<{
    uuid: string,
    name: string,
    needAttention: boolean
}[]>;

export async function get_families(req: GetFamiliesRequest, res: GetFamiliesResponse) {
    const userUuid: string = req.params.uuid;

    if(userUuid !== req.body.jwt.uuid){
        res.status(403).json({error: 'Forbidden'});
        return;
    }

    const result: InternalFamily[] = await prepareAndAll(`
        SELECT families.*
        FROM user_family
                 INNER JOIN families ON families.uuid = user_family.family_uuid
        WHERE user_uuid = ?
    `, [userUuid]);

    const promises: Promise<{uuid: string, name: string, needAttention: boolean}>[] = [];
    for (const element of result){
        promises.push(
            prepareAndAll(`
                SELECT * FROM group_request_user 
                    INNER JOIN groups ON groups.uuid = group_request_user.group_uuid
                    WHERE user_uuid != ? AND family_uuid = ?
            `, [userUuid, element.uuid]).then(
                (data) => {
                    return {
                        uuid: element.uuid,
                        name: element.name,
                        needAttention: data.length > 0
                    }
                }
            )
        );
    }

    res.json(await Promise.all(promises));
}

export type AddFamilyRequest = AuthenticatedRequest<{
    uuid: string
}, {
    familyName: string,
    userName: string
}>;

export type AddFamilyResponse = BaseResponse<{
    uuid: string,
    name: string
}>;

export async function add_family(req: AddFamilyRequest, res: AddFamilyResponse){
    const {familyName, userName} = req.body;
    const userUuid: string = req.params.uuid;
    if(!familyName || !userName){
        res.status(400).json({error: 'Bad parameter'});
        return;
    }
    
    const db = await DB;

    const familyUuid: string = uuid();
    const prepares = await Promise.all([
        db.prepare(`INSERT INTO families (uuid, name) VALUES (?, ?)`, [familyUuid, familyName]),
        db.prepare(`INSERT INTO user_family (user_uuid, family_uuid, name) VALUES (?, ?, ?)`, [userUuid, familyUuid, userName])
    ]);
    await Promise.all(prepares.map(prepare => prepare.run()));

    res.json({
        uuid: familyUuid,
        name: familyName
    });
}

export type RemoveFromFamilyRequest = AuthenticatedRequest<{
    uuid: string,
    familyUuid: string
}>;

export type RemoveFromFamilyResponse = BaseResponse<{
    success: true
}>;

export async function remove_from_family(req: RemoveFromFamilyRequest, res: RemoveFromFamilyResponse) {
    const userUuid: string = req.params.uuid;
    const familyUuid: string = req.params.familyUuid;

    if(userUuid !== req.body.jwt.uuid){
        res.status(403).json({error: 'Forbidden'});
        return;
    }
    const db = await DB;
    await (await db.prepare(`DELETE FROM user_family WHERE user_uuid = ? AND family_uuid = ?`, [userUuid, familyUuid])).run();

    res.json({success: true});
}

export type GetFamilyRequest = AuthenticatedRequest<{
    uuid: string
}>;

export type GetFamilyResponse = BaseResponse<{
    uuid: string,
    name: string,
    members: {
        uuid: string,
        name: string,
        email: string
    }[]
}>;

export async function get_family(req: GetFamilyRequest, res: GetFamilyResponse) {
    const familyUuid: string = req.params.uuid;

    const db = await DB;

    const family = await (await db.prepare(`SELECT * FROM families WHERE uuid = ?`, [familyUuid])).get();

    if(!family){
        res.status(404).json({error: 'Family not found'});
        return;
    }

    const members = await (await db.prepare(`SELECT user_family.user_uuid, user_family.name, users.email FROM user_family INNER JOIN users ON users.uuid = user_family.user_uuid WHERE family_uuid = ?`, [familyUuid])).all();

    if(!members){
        res.status(404).json({error: 'Members not found'});
        return;
    }
    
    if(members.map(member => member.user_uuid).indexOf(req.body.jwt.uuid) === -1){
        res.status(403).json({error: 'Forbidden'});
        return;
    }

    res.json({
        uuid: family.uuid,
        name: family.name,
        members: members.map(member => ({
            uuid: member.user_uuid,
            name: member.name,
            email: member.email
        }))
    });
}

export type GetMemberDataRequest = AuthenticatedRequest<{
    familyUuid: string,
    userUuid: string
}>

export type GetMemberDataResponse = BaseResponse<{
    gifts: {
        uuid: string,
        title: string,
        content: string
    }[],
    private_data: null | object
}>;
export async function get_member_data(req: GetMemberDataRequest, res: GetMemberDataResponse) {
    const {familyUuid, userUuid} = req.params;

    const db = await DB;

    const userPrivateKey = await getPrivateKeyOfUser(req.body.jwt.uuid, req.body.jwt.derived_key);

    const gifts: {
        uuid: string,
        title: string,
        content: string
    }[] = await (await db.prepare(`
        SELECT uuid, title, content 
        FROM gifts 
            INNER JOIN user_family ON user_family.user_uuid = gifts.user_family_user_uuid AND user_family.family_uuid = gifts.user_family_family_uuid
        WHERE user_family.family_uuid = ? AND user_family.user_uuid = ?
    `, [familyUuid, userUuid])).all();

    const encryptedPrivateData: {
        private_data: string
    } = await (await db.prepare(`
        SELECT groups.private_data FROM groups
            WHERE groups.target_uuid = ? AND groups.family_uuid = ?
    `, [userUuid, familyUuid])).get();

    const encryptedPrivateKey: {
        encryptedPrivateKey: string
    } = await (await db.prepare(`
        SELECT group_user.private_key as encryptedPrivateKey
        FROM group_user
            INNER JOIN groups ON groups.uuid = group_user.group_uuid
        WHERE group_user.user_uuid = ? AND groups.family_uuid = ? AND groups.target_uuid = ?
    `, [req.body.jwt.uuid, familyUuid, userUuid])).get();

    let privateData = null;
    if(encryptedPrivateKey && encryptedPrivateData){
        const privateKey = await decryptGroupUserPrivateKey(encryptedPrivateKey.encryptedPrivateKey, userPrivateKey);
        privateData = JSON.parse(await decryptPrivateData(encryptedPrivateData.private_data, privateKey));
    }

    res.json({
        gifts: gifts,
        private_data: privateData
    });
}

export type PostMemberMessageRequest = AuthenticatedRequest<{
    familyUuid: string,
    userUuid: string,
    giftUuid: string
}, {
    message: string
}>;

export type PostMemberMessageResponse = BaseResponse<{
    success: true
}>;

export async function post_member_message(req: PostMemberMessageRequest, res: PostMemberMessageResponse) {
    const {familyUuid, userUuid, giftUuid} = req.params;
    const {message} = req.body;

    if(userUuid === req.body.jwt.uuid){
        res.status(403).json({error: 'Forbidden'});
        return;
    }
    if(!message){
        res.status(400).json({error: 'Bad parameter'});
        return;
    }

    const userPrivateKey = await getPrivateKeyOfUser(req.body.jwt.uuid, req.body.jwt.derived_key);

    try {
        await editPrivateData(
            req.body.jwt.uuid,
            userPrivateKey,
            familyUuid,
            userUuid,
            giftUuid,
            (data: GiftPrivateData) => {
                data.messages.push({
                    content: message,
                    timestamp: new Date().toISOString(),
                    user_uuid: req.body.jwt.uuid
                });
    
                return data;
            }
        )
    } catch {
        res.json({
            error: "Error"
        })
    }

    res.json({success: true});
}

export type AcceptGiftRequest = AuthenticatedRequest<{
    familyUuid: string,
    userUuid: string,
    giftUuid: string
}>;

export type AcceptGiftResponse = BaseResponse<{
    success: true
}>;

export async function accept_gift(req: AcceptGiftRequest, res: AcceptGiftResponse) {
    const {familyUuid, userUuid, giftUuid} = req.params;

    if(userUuid === req.body.jwt.uuid){
        res.status(403).json({error: 'Forbidden'});
        return;
    }

    const userPrivateKey = await getPrivateKeyOfUser(req.body.jwt.uuid, req.body.jwt.derived_key);

    try {
        await editPrivateData(
            req.body.jwt.uuid,
            userPrivateKey,
            familyUuid,
            userUuid,
            giftUuid,
            (data: GiftPrivateData) => {
                data.takenBy = req.body.jwt.uuid;
    
                return data;
            }
        )
    } catch {
        res.json({
            error: "Error"
        })
    }

    res.json({success: true});
}

export type DenyGiftRequest = AuthenticatedRequest<{
    familyUuid: string,
    userUuid: string,
    giftUuid: string
}>;

export type DenyGiftResponse = BaseResponse<{
    success: true
}>;

export async function deny_gift(req: AcceptGiftRequest, res: AcceptGiftResponse) {
    const {familyUuid, userUuid, giftUuid} = req.params;

    if(userUuid === req.body.jwt.uuid){
        res.status(403).json({error: 'Forbidden'});
        return;
    }

    const userPrivateKey = await getPrivateKeyOfUser(req.body.jwt.uuid, req.body.jwt.derived_key);

    try {
        await editPrivateData(
            req.body.jwt.uuid,
            userPrivateKey,
            familyUuid,
            userUuid,
            giftUuid,
            (data: GiftPrivateData) => {
                if(data.takenBy === req.body.jwt.uuid){
                    data.takenBy = null;
                }
    
                return data;
            }
        )
    } catch {
        res.json({
            error: "Error"
        })
    }

    res.json({success: true});
}

export type AddGiftRequest = AuthenticatedRequest<{
    familyUuid: string,
    userUuid: string
}, {
    title: string,
    content: string
}>;

export type AddGiftResponse = BaseResponse<{
    success: true
}>;

export async function add_gift(req: AddGiftRequest, res: AddGiftResponse) {
    const {familyUuid, userUuid} = req.params;
    let {title, content} = req.body;

    if(!content) {
        content = "";
    }

    if(!title){
        res.status(400).json({error: 'Bad parameter'});
        return;
    }

    const db = await DB;

    const giftUuid = uuid();

    await (await db.prepare(`INSERT INTO gifts (uuid, title, content, user_family_user_uuid, user_family_family_uuid) VALUES (?, ?, ?, ?, ?)`, [giftUuid, title, content, userUuid, familyUuid])).run();

    res.json({success: true});
}

export type DeleteGiftRequest = AuthenticatedRequest<{
    familyUuid: string,
    userUuid: string,
    giftUuid: string
}>;

export type DeleteGiftResponse = BaseResponse<{
    success: true
}>;

export async function delete_gift(req: DeleteGiftRequest, res: DeleteGiftResponse) {
    const {giftUuid} = req.params;

    const db = await DB;

    await (await db.prepare(`DELETE FROM gifts WHERE uuid = ?`, [giftUuid])).run();

    res.json({success: true});
}