import { Database } from "sqlite";
import { DerivedKey, UserApi } from "./users";
import { decryptUserPrivateData } from "../../lib/crypto";

export interface EncryptedPrivateData {
    uuid: string
}

export interface PrivateData extends EncryptedPrivateData {
    data: Action<any>
}

export interface Action<T> {
    action: string,
    data: T
}

class ActionFactory {
    builders: {
        "group_invitation": (data: GroupInvitationData) => Action<GroupInvitationData>
    }

    constructor() {
        this.builders = {
            "group_invitation": (data: GroupInvitationData): Action<GroupInvitationData> => {
                return new GroupInvitationAction(data);
            }
        };
    }

    parse<T>(data: {
        action: string,
        data: T
    }): null|Action<T> {
        if(!data.action) return null;
        if(!this.builders[data.action]) return null;
        return this.builders[data.action](data.data);
    }

    parseAll(data: string): null|Action<any>[] {
        let parsed = JSON.parse(data);
        if(!Array.isArray(parsed)) return null;
        let result: Action<any>[] = [];
        parsed.forEach(element => {
            let action = this.parse(element);
            if(action !== null) result.push(action);
        });
        return result;
    }
}

type GroupInvitationData = {
    familyUuid: string,
    familyName: string,
    targetName: string
}

class GroupInvitationAction implements Action<GroupInvitationData> {
    action: string = "group_invitation";
    data: GroupInvitationData;

    constructor(data: GroupInvitationData) {
        this.data = data;
    }
}

export class UserPrivateData {
    db: Database;
    userApi: UserApi;
    actionFactory: ActionFactory;

    constructor(db: Database, userApi: UserApi) {
        this.db = db;
        this.userApi = userApi;
        this.actionFactory = new ActionFactory();
    }

    async getPrivateDataForUuid<T extends DerivedKey | null>(uuid: string, derivedKey: T = null as T) : Promise<T extends null ? EncryptedPrivateData[] : PrivateData[]> {
        let encryptedPrivateData = await (await this.db.prepare(`SELECT uuid, private_data FROM user_private_data WHERE user_uuid = ?`, [uuid])).all();
        if(derivedKey === null) {
            let result: EncryptedPrivateData[] = [];
            encryptedPrivateData.forEach(element => {
                result.push({
                    uuid: element.uuid
                });
            });
            return result as T extends null ? EncryptedPrivateData[] : PrivateData[];
        }else{
            let privateKey = await this.userApi.getPrivateKeyForUuid(uuid, derivedKey);
            if(privateKey === null){
                return [];
            }
            let result: PrivateData[] = [];
            encryptedPrivateData.forEach(async element => {
                let data = this.actionFactory.parseAll(await decryptUserPrivateData(element.private_data, privateKey))
                if(data === null) return;
                result.push({
                    uuid: element.uuid,
                    data: data
                });
            });
            return result as T extends null ? EncryptedPrivateData[] : PrivateData[];
        }
        return [];
    }
}