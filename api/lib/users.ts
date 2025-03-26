import { Database } from "sqlite";
import { sendMail } from "./email.ts";
import {
    generateSalt,
    generateUserKeyPair,
    DerivedKey,
    UserPublicKey,
    UserPrivateKey
} from "./crypto.ts";
import { uuid } from "uuidv4";
import {checkPassword, hashPassword} from "./login.ts";
import {DB, prepareAndAll, prepareAndGet, prepareAndRun} from "./db.ts";
import { logger } from "./logger.ts";

export interface UnloggedUser {
    uuid: string,
    email: string,
    password: string,
    salt: string,
    public_key: UserPublicKey,
    verified: number,
    verification_code: string | null
}

export interface LoggedUser extends UnloggedUser {
    derived_key: DerivedKey,
    private_key: UserPrivateKey
}

export async function getUserApi() {
    const db = await DB;

    return new UserApi(db);
}

export class UserApi {
    db!: Database;

    static _instance: UserApi | undefined;

    constructor(db: Database) {
        if (UserApi._instance) {
            return UserApi._instance
        }
        UserApi._instance = this;

        this.db = db;
    }

    async getUsers(): Promise<Partial<UnloggedUser>[]> {
        const result: Partial<UnloggedUser>[] = [];

        for (const element of (await prepareAndAll("SELECT * FROM users"))) {
            result.push({
                uuid: element.uuid,
                email: element.email,
                password: element.password,
                salt: element.salt,
                public_key: await UserPublicKey.import(element.public_key)
            });
        }

        return result;
    } 

    async getUserByEmail<T extends (string|null)>(email: string, password: T = null as T): Promise<null | (T extends null ? UnloggedUser : LoggedUser)>{
        const result = await prepareAndGet("SELECT * FROM users WHERE email = ?", [email]);
        if(!result) return null;

        const baseUser: UnloggedUser = {
            uuid: result.uuid,
            email: result.email,
            password: result.password,
            salt: result.salt,
            public_key: await UserPublicKey.import(result.public_key),
            verified: result.verified,
            verification_code: result.verification_code
        };
        if(password === null){
            return baseUser as T extends null ? UnloggedUser : never;
        }else{
            if((await checkPassword(password, baseUser.password)) === false) {
                return null;
            }
            const derivedKey = await DerivedKey.derive(password, baseUser.salt);
            return {
                ...baseUser,
                derived_key: derivedKey,
                private_key: await UserPrivateKey.decryptWithDerived(result.private_key, derivedKey)
            } as LoggedUser;
        }
    }

    async getUserByUuid(uuid: string): Promise<null | UnloggedUser>{
        const result = await prepareAndGet("SELECT * FROM users WHERE uuid = ?", [uuid]);
        if(!result) return null;

        return {
            uuid: result.uuid,
            email: result.email,
            password: result.password,
            salt: result.salt,
            verified: result.verified,
            verification_code: result.verification_code,
            public_key: await UserPublicKey.import(result.public_key)
        };
    }

    async createUser(email: string, password: string) : Promise<Partial<UnloggedUser>> {
        logger.debug("Creating user with email: " + email);
        const userUuid: string = uuid();
        const userKeyPair = await generateUserKeyPair();
        const userSalt = await generateSalt();
        const userDerivedKey = await DerivedKey.derive(password, userSalt);
        const encryptedPrivateKey = await userKeyPair.privateKey.encryptWithDerived(userDerivedKey);
        const hashedPassword = await hashPassword(password);
        await prepareAndRun(`INSERT INTO users (
            uuid, email, password, salt, private_key, public_key, verified, verification_code
        ) VALUES (?, ?, ?, ?, ?, ?, 0, NULL)`, [
            userUuid, email, hashedPassword, userSalt, 
            encryptedPrivateKey, await userKeyPair.publicKey.export()
        ]);

        await this.resetVerificationCode(userUuid);

        return {
            uuid: userUuid,
            email: email,
            password: hashedPassword,
            salt: userSalt,
            verified: 0,
            public_key: userKeyPair.publicKey
        };
    }

    async getPrivateKeyForUuid(uuid: string, derivedKey: DerivedKey) : Promise<null|UserPrivateKey> {
        const encryptedUserPrivateKey = await prepareAndGet(`SELECT private_key FROM users WHERE uuid = ?`, [uuid]);
        if(!encryptedUserPrivateKey) return null;

        return await UserPrivateKey.decryptWithDerived(encryptedUserPrivateKey.private_key, derivedKey);
    }

    async resetVerificationCode(userUuid: string) : Promise<void> {
        const verification_code = uuid();
        const user = await this.getUserByUuid(userUuid);
        if(!user) throw new Error("User not found");
        await prepareAndRun(`UPDATE users SET verification_code = ? WHERE uuid = ?`, [verification_code, userUuid]);

        await sendMail(
            "WishNest <no-reply@tchallon.fr>",
            user.email,
            "WishNest - Vérification de votre compte",
            `Bonjour ${user.email},\n\nMerci de vous être inscrit sur WishNest !\n\nPour valider votre compte, voici votre code de vérification : ${verification_code}\n\nMerci de l'entrer dans l'application pour valider votre compte.\n\nCordialement,\nWishNest`
        );

        logger.debug("Reset verification code for user " + userUuid + " to " + verification_code);

    }


    async verifyUser(uuid: string) : Promise<void> {
        const user = await this.getUserByUuid(uuid);
        if(!user) throw new Error("User not found");

        await prepareAndRun(`UPDATE users SET verified = 1, verification_code = NULL WHERE uuid = ?`, [uuid]);
    }
        
}