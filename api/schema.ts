import { Database } from "sqlite";

async function createUserTable(db: Database) {
    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            uuid TEXT PRIMARY KEY,
            email TEXT NOT NULL,
            password TEXT NOT NULL,
            salt TEXT NOT NULL,
            private_key TEXT NOT NULL,
            public_key TEXT NOT NULL
        )
    `);
}

async function createFamilyTable(db: Database) {
    await db.exec(`
        CREATE TABLE IF NOT EXISTS families (
            uuid TEXT PRIMARY KEY,
            name TEXT NOT NULL
        )
    `);
}

async function createUserFamilyTable(db: Database) {
    await db.exec(`
        CREATE TABLE IF NOT EXISTS user_family (
            user_uuid TEXT NOT NULL,
            family_uuid TEXT NOT NULL,
            name TEXT NOT NULL,
            PRIMARY KEY (user_uuid, family_uuid),
            FOREIGN KEY (user_uuid) REFERENCES users(uuid),
            FOREIGN KEY (family_uuid) REFERENCES families(uuid)
        )
    `);
}

async function createUserFamilyInvitationTable(db: Database) {
    await db.exec(`
        CREATE TABLE IF NOT EXISTS user_family_invitations (
            uuid TEXT PRIMARY KEY,
            user_uuid TEXT NOT NULL,
            family_uuid TEXT NOT NULL,
            FOREIGN KEY (user_uuid) REFERENCES users(uuid),
            FOREIGN KEY (family_uuid) REFERENCES families(uuid),
            UNIQUE(user_uuid, family_uuid)
        )
    `);
}

async function createGroupTable(db: Database) {
    await db.exec(`
        CREATE TABLE IF NOT EXISTS groups (
            uuid TEXT PRIMARY KEY,
            target_uuid TEXT NOT NULL,
            family_uuid TEXT NOT NULL,
            private_data BIGBLOB NOT NULL,
            FOREIGN KEY (target_uuid) REFERENCES user_family(user_uuid),
            FOREIGN KEY (family_uuid) REFERENCES families(uuid)
        )
    `);
}

async function createGroupUserTable(db: Database) {
    await db.exec(`
        CREATE TABLE IF NOT EXISTS group_user (
            group_uuid TEXT NOT NULL,
            user_uuid TEXT NOT NULL,
            private_key BIGBLOB NOT NULL,
            public_key BIGBLOB NOT NULL,
            PRIMARY KEY (group_uuid, user_uuid),
            FOREIGN KEY (group_uuid) REFERENCES groups(uuid),
            FOREIGN KEY (user_uuid) REFERENCES user_family(user_uuid)
        )
    `);
}

async function createGroupRequestUserTable(db: Database) {
    await db.exec(`
        CREATE TABLE IF NOT EXISTS group_request_user (
            group_uuid TEXT NOT NULL,
            user_uuid TEXT NOT NULL,
            PRIMARY KEY (group_uuid, user_uuid),
            FOREIGN KEY (group_uuid) REFERENCES groups(uuid),
            FOREIGN KEY (user_uuid) REFERENCES user_family(user_uuid)
        )
    `);
}

async function createGiftTable(db: Database) {
    await db.exec(`
        CREATE TABLE IF NOT EXISTS gifts (
            uuid TEXT PRIMARY KEY,
            user_family_user_uuid TEXT NOT NULL,
            user_family_family_uuid TEXT NOT NULL,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            FOREIGN KEY (user_family_user_uuid, user_family_family_uuid) REFERENCES user_family(user_uuid, family_uuid),
            UNIQUE(user_family_user_uuid, user_family_family_uuid, title)
        )
    `);
}

async function createCommentTable(db: Database) {
    await db.exec(`
        CREATE TABLE IF NOT EXISTS comments (
            uuid TEXT PRIMARY KEY,
            gift_uuid TEXT NOT NULL,
            user_family_uuid TEXT NOT NULL,
            content TEXT NOT NULL,
            FOREIGN KEY (gift_uuid) REFERENCES gifts(uuid),
            FOREIGN KEY (user_family_uuid) REFERENCES user_family(uuid)
        )
    `);
}

async function createAll(db: Database) {
    await Promise.all([
        createUserTable(db),
        createFamilyTable(db),
        createUserFamilyTable(db),
        createUserFamilyInvitationTable(db),
        createGroupTable(db),
        createGroupUserTable(db),
        createGroupRequestUserTable(db),
        createGiftTable(db),
        createCommentTable(db)
    ])
}

export { createAll };