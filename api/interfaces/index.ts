export type User = {
    uuid: string,
    email: string
}

export type InternalUser = {
    uuid: string,
    email: string,
    password: string,
    salt: string
}

export type Family = {
    uuid: string,
    name: string,
    needAttention?: boolean
}

export type InternalFamily = {
    uuid: string,
    name: string,
}

export type Invitation = {
    uuid: string,
    family: Family
}

export type GroupPrivateData = {
    [id: string]: GiftPrivateData
}

export type GiftPrivateData = {
    messages: {
        content: string,
        timestamp: string,
        user_uuid: string
    }[],
    takenBy?: null|string
}