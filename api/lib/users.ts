import { Database } from "sqlite";
import {
    decryptPrivateKeyUser,
    deriveKey,
    encryptPrivateKeyUser,
    exportUserPublicKey,
    generateSalt,
    generateUserKeyPair,
    importUserPublicKey
} from "../../lib/crypto";
import { uuid } from "uuidv4";
import {checkPassword, hashPassword} from "../../lib/login";
import {DerivedKey, UserPrivateKey, UserPublicKey} from "../../lib/types";
import {DB} from "./db.ts";
import { logger } from "./logger.ts";

export interface UnloggedUser {
    uuid: string,
    email: string,
    password: string,
    salt: string,
    public_key: UserPublicKey
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

    async getUsers(): Promise<UnloggedUser[]> {
        const result: UnloggedUser[] = [];

        for (const element of (await (await this.db.prepare("SELECT * FROM users")).all())) {
            result.push({
                uuid: element.uuid,
                email: element.email,
                password: element.password,
                salt: element.salt,
                public_key: await importUserPublicKey(element.public_key)
            });
        }

        return result;
    } 

    async getUserByEmail<T extends (string|null)>(email: string, password: T = null as T): Promise<null | (T extends null ? UnloggedUser : LoggedUser)>{
        const result = await (await this.db.prepare("SELECT * FROM users WHERE email = ?")).get(email);
        if(!result) return null;

        const baseUser: UnloggedUser = {
            uuid: result.uuid,
            email: result.email,
            password: result.password,
            salt: result.salt,
            public_key: await importUserPublicKey(result.public_key)
        };
        if(password === null){
            return baseUser as T extends null ? UnloggedUser : never;
        }else{
            if((await checkPassword(password, baseUser.password)) === false) {
                return null;
            }
            const derivedKey = await deriveKey(password, baseUser.salt);
            return {
                ...baseUser,
                derived_key: derivedKey,
                private_key: await decryptPrivateKeyUser(result.private_key, derivedKey)
            } as LoggedUser;
        }
    }

    async getUserByUuid(uuid: string): Promise<null | UnloggedUser>{
        const result = await (await this.db.prepare("SELECT * FROM users WHERE uuid = ?")).get(uuid);
        if(!result) return null;

        return {
            uuid: result.uuid,
            email: result.email,
            password: result.password,
            salt: result.salt,
            public_key: await importUserPublicKey(result.public_key)
        };
    }

    async createUser(email: string, password: string) : Promise<UnloggedUser> {
        logger.debug("Creating user with email: " + email);
        const userUuid: string = uuid();
        const userKeyPair: CryptoKeyPair = await generateUserKeyPair();
        const userSalt = await generateSalt();
        const userDerivedKey: CryptoKey = await deriveKey(password, userSalt);
        const encryptedPrivateKey = await encryptPrivateKeyUser(userKeyPair.privateKey, userDerivedKey);
        const hashedPassword = await hashPassword(password);
        const prepare = await this.db.prepare(`INSERT INTO users (
            uuid, email, password, salt, private_key, public_key
        ) VALUES (?, ?, ?, ?, ?, ?)`, [
            userUuid, email, hashedPassword, userSalt, 
            encryptedPrivateKey, await exportUserPublicKey(userKeyPair.publicKey)
        ]);
        await prepare.run();

        return {
            uuid: userUuid,
            email: email,
            password: hashedPassword,
            salt: userSalt,
            public_key: userKeyPair.publicKey
        };
    }

    async getPrivateKeyForUuid(uuid: string, derivedKey: DerivedKey) : Promise<null|UserPrivateKey> {
        const encryptedUserPrivateKey = (await (await this.db.prepare(`SELECT private_key FROM users WHERE uuid = ?`, [uuid])).get());
        if(!encryptedUserPrivateKey) return null;

        return await decryptPrivateKeyUser(encryptedUserPrivateKey.private_key, derivedKey);
    }
        
}