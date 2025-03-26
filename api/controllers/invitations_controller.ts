import {AuthenticatedRequest, BaseResponse} from "./controllers";
import {prepareAndAll, prepareAndGet, prepareAndRun} from "../lib/db";
import {uuid} from "uuidv4";
import {getUserApi} from "../lib/users";
import { sendMail } from "../lib/email";
import {generateGroupUserKeyPair, UserPublicKey} from "../lib/crypto";

export type GetInvitationsUserRequest = AuthenticatedRequest<{
    uuid: string
}>;

type GetInvitationsUserInvitation = {
    uuid: string,
    family: {
        uuid: string,
        name: string
    }
}

export type GetInvitationsUserResponse = BaseResponse<GetInvitationsUserInvitation[]>;

export async function get_user_family_invitations(req: GetInvitationsUserRequest, res: GetInvitationsUserResponse) {
    const result: {
        familyUuid: string,
        name: string,
        invitationUuid: string
    }[] = await prepareAndAll(`
        SELECT families.uuid as familyUuid, families.name as name, user_family_invitations.uuid as invitationUuid 
        FROM user_family_invitations 
            INNER JOIN families ON families.uuid = user_family_invitations.family_uuid 
        WHERE user_uuid = ?
    `, [req.params.uuid]);

    const user = await (await getUserApi()).getUserByUuid(req.params.uuid);
    if(!user){
        res.json({error: 'User not found'}).status(404);
        return;
    }

    const external: {
        familyUuid: string,
        name: string,
        invitationUuid: string
    }[] = await prepareAndAll(`
        SELECT families.uuid as familyUuid, families.name as name, external_email_invitations.uuid as invitationUuid 
        FROM external_email_invitations 
            INNER JOIN families ON families.uuid = external_email_invitations.family_uuid 
        WHERE email = ?
    `, [user?.email]);
    result.push(...external);

    res.json(result.map(element => ({
        uuid: element.invitationUuid,
        family: {
            uuid: element.familyUuid,
            name: element.name
        }
    })));
}

export type AcceptFamilyInvitationRequest = AuthenticatedRequest<{
    uuid: string;
    invitationUuid: string;
}, {
    userName: string
}>;

export type AcceptFamilyInvitationResponse = BaseResponse<{
    success: true
}>

export async function accept_family_invitation(req: AcceptFamilyInvitationRequest, res: AcceptFamilyInvitationResponse) {
    const userUuid: string = req.params.uuid;
    const invitationUuid: string = req.params.invitationUuid;
    const userName: string = req.body.userName;

    let external = false;
    let familyUuidToAsk;
    const invitation: {
        uuid: string,
        user_uuid: string,
        family_uuid: string
    } = await prepareAndGet(`SELECT * FROM user_family_invitations WHERE uuid = ?`, [invitationUuid]);
    if(!invitation){
        const externalInvitation: {
            uuid: string,
            email: string,
            family_uuid: string
        } = await prepareAndGet(`SELECT * FROM external_email_invitations WHERE uuid = ?`, [invitationUuid]);

        if(!externalInvitation){
            res.json({error: 'Invitation not found'}).status(404);
            return;
        }

        familyUuidToAsk = externalInvitation.family_uuid;
        external = true;
    }else{
        familyUuidToAsk = invitation.family_uuid;
    }

    const family: {
        uuid: string,
        name: string
    } = await prepareAndGet(`SELECT * FROM families WHERE uuid = ?`, [familyUuidToAsk]);
    if(!family){
        res.json({error: 'Family not found'}).status(404);
        return;
    }
    const familyUuid = family.uuid;

    const user: {
        uuid: string,
        private_key: string,
        public_key: string,
        email: string
    } = await prepareAndGet(`SELECT * FROM users WHERE uuid = ?`, [userUuid]);
    if(!user){
        res.json({error: 'User not found'}).status(404);
        return;
    }
    const loggedUserPubKey = await UserPublicKey.import(user.public_key);

    const familyUsers: {
        user_uuid: string,
        public_key: string
    }[] = await prepareAndAll(`
        SELECT user_uuid, public_key 
        FROM user_family 
            INNER JOIN users ON users.uuid = user_family.user_uuid 
        WHERE family_uuid = ? AND user_uuid != ?
    `, [familyUuid, userUuid]);

    // on créer le nouveau groupe pour le nouveau membre
    const newGroupUuid = uuid();
    const newGroupPrivateKeyPair = await generateGroupUserKeyPair();
    const newGroupEncryptedData = await newGroupPrivateKeyPair.publicKey.encode(JSON.stringify({}));

    // On lie l'utilisateur à la famille
    await prepareAndRun(`INSERT INTO user_family (
            user_uuid, family_uuid, name
        ) VALUES (?, ?, ?)`, [userUuid, familyUuid, userName]);

    // On créer le nouveau groupe
    await prepareAndRun(`INSERT INTO groups (
            uuid, target_uuid, family_uuid, private_data
        ) VALUES (?, ?, ?, ?)`, [newGroupUuid, userUuid, familyUuid, newGroupEncryptedData]);

    for (const familyUser of familyUsers) {
        // on ajoute tout les membres de la famille a ce nouveau groupe
        const userPubKey = await UserPublicKey.import(familyUser.public_key);
        const userGroupPrivateKey = await newGroupPrivateKeyPair.privateKey.encrypt(userPubKey);
        const userGroupPublicKey = await newGroupPrivateKeyPair.publicKey.encrypt(userPubKey);

        await prepareAndRun(`INSERT INTO group_user (
                    group_uuid, user_uuid, private_key, public_key
                ) VALUES (?, ?, ?, ?)`, [
            newGroupUuid, familyUser.user_uuid, userGroupPrivateKey, userGroupPublicKey
        ]);

        // On s'invite dans tout les autres groupes
        const familyUserGroupUuid: {
            uuid: string
        } = await prepareAndGet(`SELECT uuid FROM groups WHERE target_uuid = ? AND family_uuid = ?`, [familyUser.user_uuid, familyUuid]);

        if(familyUserGroupUuid == null){
            // groupe inexistant, on le créer
            const familyUserNewGroupUuid = uuid();
            const familyUserNewGroupPrivateKeyPair = await generateGroupUserKeyPair();
            const familyUserNewGroupEncryptedData = await familyUserNewGroupPrivateKeyPair.publicKey.encode(JSON.stringify({}));

            await prepareAndRun(`INSERT INTO groups (
                    uuid, target_uuid, family_uuid, private_data
                ) VALUES (?, ?, ?, ?)`, [familyUserNewGroupUuid, familyUser.user_uuid, familyUuid, familyUserNewGroupEncryptedData]);

            const encryptedPrivateKey: string = await familyUserNewGroupPrivateKeyPair.privateKey.encrypt(loggedUserPubKey);
            const encryptedPublicKey: string = await familyUserNewGroupPrivateKeyPair.publicKey.encrypt(loggedUserPubKey);

            await prepareAndRun(`INSERT INTO group_user (
                    group_uuid, user_uuid, private_key, public_key
                ) VALUES (?, ?, ?, ?)`, [
                familyUserNewGroupUuid, userUuid, encryptedPrivateKey, encryptedPublicKey
            ]);
        } else {
            // groupe existant, on demande l'accès
            await prepareAndRun(`INSERT INTO group_request_user (
                     group_uuid, user_uuid           
                ) VALUES (?, ?)`, [familyUserGroupUuid.uuid, userUuid]);
        }
    }

    if(external){
        await prepareAndRun(`DELETE FROM external_email_invitations WHERE uuid = ?`, [invitationUuid]);
    }else{
        await prepareAndRun(`DELETE FROM user_family_invitations WHERE uuid = ?`, [invitationUuid]);
    }

    res.json({success: true});
}

export type GetUserGroupRequests = AuthenticatedRequest<{
    uuid: string,
    familyUuid: string
}>;

export type GetUserGroupRequestsResponse = BaseResponse<{
    groupUuid: string,
    targetUuid: string,
    originName: string,
    targetName: string
}[]>;

export async function get_user_group_requests(req: GetUserGroupRequests, res: GetUserGroupRequestsResponse) {
    const uuid: string = req.params.uuid;
    const familyUuid: string = req.params.familyUuid;

    const groupRequests: {
        group_uuid: string,
        user_uuid: string,
        originName: string,
        targetName: string
    }[] = await prepareAndAll(`
        SELECT group_request_user.*, origin.name originName, target.name targetName
        FROM group_request_user
                 INNER JOIN groups g ON g.uuid = group_request_user.group_uuid
                 INNER JOIN user_family origin ON g.family_uuid = origin.family_uuid AND group_request_user.user_uuid = origin.user_uuid
                 INNER JOIN user_family target ON g.family_uuid = target.family_uuid AND g.target_uuid = target.user_uuid
        WHERE
            group_request_user.user_uuid != ? AND
            g.family_uuid = ? AND
            target.user_uuid != ?
    `, [uuid, familyUuid, uuid]);

    res.json(groupRequests.map(element => ({
        groupUuid: element.group_uuid,
        targetUuid: element.user_uuid,
        originName: element.originName,
        targetName: element.targetName
    })));
}

export type AcceptUserGroupRequestRequest = AuthenticatedRequest<{
    groupUuid: string,
    userUuid: string
}>;

export type AcceptUserGroupRequestResponse = BaseResponse<{
    success: true
}>;

export async function accept_user_group_request(req: AcceptUserGroupRequestRequest, res: AcceptUserGroupRequestResponse) {
    const groupUuid: string = req.params.groupUuid;
    const userUuid: string = req.params.userUuid;

    const request: {
        group_uuid: string,
        user_uuid: string
    } = await prepareAndGet(`SELECT * FROM group_request_user WHERE group_uuid = ? AND user_uuid = ?`, [groupUuid, userUuid]);
    if (!request) {
        res.json({error: 'Request not found'}).status(404);
        return;
    }

    const userApi = await getUserApi();

    const user = await userApi.getUserByUuid(userUuid);
    if (!user) {
        res.json({error: 'User not found'}).status(404);
        return;
    }
    const userPrivateKey = await userApi.getPrivateKeyForUuid(req.body.jwt.uuid, req.body.jwt.derived_key);

    if(!userPrivateKey){
        res.json({error: 'User private key not found'}).status(404);
        return;
    }

    const group: {
        uuid: string,
        target_uuid: string,
        family_uuid: string,
        private_data: string
    } = await prepareAndGet(`SELECT * FROM groups WHERE uuid = ?`, [groupUuid]);
    if (!group) {
        res.json({error: 'Group not found'}).status(404);
        return;
    }

    const currentUserGroup: {
        group_uuid: string,
        user_uuid: string,
        private_key: string,
        public_key: string,
    } = await prepareAndGet(`SELECT * FROM group_user WHERE group_uuid = ? AND user_uuid = ?`, [groupUuid, req.body.jwt.uuid]);
    if (!currentUserGroup) {
        res.json({error: 'User not in group'}).status(404);
        return;
    }

    // TODO: lock
    const privateKeyGroup = await userPrivateKey.decryptGroupUserPrivateKey(currentUserGroup.private_key);
    const publicKeyGroup = await userPrivateKey.decryptGroupUserPublicKey(currentUserGroup.public_key);

    const encryptedPrivateKey: string = await privateKeyGroup.encrypt(user.public_key);
    const encryptedPublicKey: string = await publicKeyGroup.encrypt(user.public_key);

    await prepareAndRun(`INSERT INTO group_user (
            group_uuid, user_uuid, private_key, public_key
        ) VALUES (?, ?, ?, ?)`, [
        groupUuid, userUuid, encryptedPrivateKey, encryptedPublicKey
    ]);

    await prepareAndRun(`DELETE FROM group_request_user WHERE group_uuid = ? AND user_uuid = ?`, [groupUuid, userUuid]);

    res.json({success: true});
}

export type CreateInvitationRequest = AuthenticatedRequest<{
    familyUuid: string
}, {
    email: string
}>;

export type CreateInvitationResponse = BaseResponse<{
    success: true
}>;

export async function create_invitation(req: CreateInvitationRequest, res: CreateInvitationResponse) {
    const familyUuid: string = req.params.familyUuid;
    const email: string = req.body.email;

    const family: {
        uuid: string,
        name: string
    } = await prepareAndGet(`SELECT * FROM families WHERE uuid = ?`, [familyUuid]);
    if (!family) {
        res.json({error: 'Family not found'}).status(404);
        return;
    }

    const user: {
        uuid: string
    } = await prepareAndGet(`SELECT uuid FROM users WHERE email = ?`, [email]);
    if (!user) {
        const actualExternalEmailInvitation: object[] = await prepareAndAll(`SELECT * FROM external_email_invitations WHERE email = ? AND family_uuid = ?`, [email, familyUuid]);
        if (actualExternalEmailInvitation.length !== 0) {
            res.json({error: 'User already invited'}).status(400);
            return;
        }
        await prepareAndRun(`INSERT INTO external_email_invitations (uuid, email, family_uuid) VALUES (?, ?, ?)`, [uuid(), email, familyUuid]);
        sendMail(
            "WishNest <no-reply@tchallon.fr>",
            email,
            "WishNest - Invitation dans la famille " + family.name,
            null,
            `Bonjour ${email},<br><br>Un membre de la famille ${family.name} vous a invité à rejoindre sa famille sur WishNest.<br><br>Pour accepter l'invitation, créez un compte sur <a href="${process.env.VITE_FRONT_URL}/register">WishNest</a> avec cet email et acceptez d'invitation.<br><br>Cordialement,<br>WishNest`
        );
        res.json({success: true});
        return;
    }

    // check if user is already in the family
    const userFamily: {
        user_uuid: string
    }[] = await prepareAndAll(`SELECT * FROM user_family WHERE user_uuid = ? AND family_uuid = ?`, [user.uuid, familyUuid]);
    if (userFamily.length !== 0) {
        res.json({error: 'User already in family'}).status(400);
        return;
    }

    const invitationUuid = uuid();

    await prepareAndRun(`INSERT INTO user_family_invitations (
            uuid, user_uuid, family_uuid
        ) VALUES (?, ?, ?)`, [invitationUuid, user.uuid, familyUuid]);

    res.json({success: true});
}

export type GetFamilyInvitationsRequest = AuthenticatedRequest<{
    familyUuid: string
}>;

export type GetFamilyInvitationsResponse = BaseResponse<{
    uuid: string,
    user_uuid: string | null,
    email: string,
    external: boolean
}[]>;

export async function get_family_invitations(req: GetFamilyInvitationsRequest, res: GetFamilyInvitationsResponse) {
    const familyUuid: string = req.params.familyUuid;

    const invitations: {
        uuid: string,
        user_uuid: string | null,
        email: string
    }[] = await prepareAndAll(`
        SELECT user_family_invitations.*, users.email as email 
            FROM user_family_invitations 
                INNER JOIN users ON users.uuid = user_family_invitations.user_uuid 
            WHERE family_uuid = ?`, [familyUuid]);

    const externalInvitations: {
        uuid: string,
        email: string
    }[] = await prepareAndAll(`SELECT * FROM external_email_invitations WHERE family_uuid = ?`, [familyUuid]);
    invitations.push(...externalInvitations.map(element => ({
        uuid: element.uuid,
        user_uuid: null,
        email: element.email
    })));

    res.json(invitations.map(element => ({
        uuid: element.uuid,
        user_uuid: element.user_uuid,
        email: element.email,
        external: element.user_uuid == null
    })));
}

export type DeleteFamilyInvitationRequest = AuthenticatedRequest<{
    uuid: string
}>;

export type DeleteFamilyInvitationResponse = BaseResponse<{
    success: true
}>;

export async function delete_family_invitation(req: DeleteFamilyInvitationRequest, res: DeleteFamilyInvitationResponse) {
    const invitationUuid: string = req.params.uuid;

    await prepareAndRun(`DELETE FROM user_family_invitations WHERE uuid = ?`, [invitationUuid]);
    await prepareAndRun(`DELETE FROM external_email_invitations WHERE uuid = ?`, [invitationUuid]);

    res.json({success: true});
}