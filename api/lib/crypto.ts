import { getRandomValues, subtle } from "crypto";

function arrayBufferToBase64(buffer: ArrayBuffer): string {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
    return Uint8Array.from(atob(base64), c => c.charCodeAt(0)).buffer;
}

export async function generateSalt(): Promise<string> {
    const salt = getRandomValues(new Uint8Array(16)); // 128-bit salt
    return arrayBufferToBase64(salt);
}

const DERIVED_KEY_ALGORITHM = "PBKDF2";

export class DerivedKey {
    base: CryptoKey;

    constructor(base: CryptoKey) {
        this.base = base;
    }

    static async derive(password: string, saltBase64: string): Promise<DerivedKey> {
        const salt = base64ToArrayBuffer(saltBase64);

        const passwordKey = await subtle.importKey(
            "raw",
            new TextEncoder().encode(password),
            DERIVED_KEY_ALGORITHM,
            false,
            ["deriveKey"]
        );

        return new DerivedKey(await subtle.deriveKey(
            {
                name: DERIVED_KEY_ALGORITHM,
                salt: salt,
                iterations: 100000,
                hash: "SHA-256"
            },
            passwordKey,
            { name: "AES-GCM", length: 256 },
            true,
            ["encrypt", "decrypt"]
        ));
    }

    static async fromB64(data: string) : Promise<DerivedKey> {
        return new DerivedKey(await subtle.importKey(
            "raw",
            base64ToArrayBuffer(data),
            { name: "AES-GCM" },
            false,
            ["encrypt", "decrypt"]
        ));
    }

    async toB64(): Promise<string> {
        const exported = await subtle.exportKey("raw", this.base);
        return arrayBufferToBase64(exported);
    }
}

abstract class Key {
    base: CryptoKey;

    constructor(base: CryptoKey) {
        this.base = base;
    }

    abstract getAlgorithm(): "raw" | "pkcs8" | "spki";

    async export(): Promise<string> {
        const exportedPublicKey = await subtle.exportKey(this.getAlgorithm(), this.base);
        return arrayBufferToBase64(exportedPublicKey);
    }
}

const PUBLIC_KEY_ALGORITHM: "raw" | "pkcs8" | "spki" = "spki";

class PublicKey extends Key {

    getAlgorithm(): "raw" | "pkcs8" | "spki" {
        return PUBLIC_KEY_ALGORITHM;
    }
    
    static async import(encodeKey: string) : Promise<PublicKey> {
        const publicKeyBuffer = base64ToArrayBuffer(encodeKey);
        
        return new this(await subtle.importKey(
            PUBLIC_KEY_ALGORITHM,
            publicKeyBuffer,
            { name: "RSA-OAEP", hash: "SHA-256" },
            true,
            ["encrypt"]
        ));
    }

    async encode(data: string) : Promise<string> {
        const encryptedChunks: Promise<string>[] = [];
        let offset = 0;
        const chunkSize = 190; // 2048-bit key size - 42 bytes
        while (offset < data.length) {
            const chunk = data.slice(offset, offset + chunkSize);

            encryptedChunks.push(subtle.encrypt(
                {
                    name: "RSA-OAEP"
                },
                this.base,
                new TextEncoder().encode(chunk)
            ).then((encrypted) => arrayBufferToBase64(encrypted)));

            offset += chunkSize;
        }

        return Promise.all(encryptedChunks).then((chunks) => chunks.join(":"));
    }
}

const PRIVATE_KEY_ALGORITHM: "pkcs8" | "spki" = "pkcs8";

class PrivateKey extends Key {
    getAlgorithm(): "raw" | "pkcs8" | "spki" {
        return PRIVATE_KEY_ALGORITHM;
    }

    static async import(encodeKey: string) : Promise<PrivateKey> {
        const privateKeyBuffer = base64ToArrayBuffer(encodeKey);

        return new this(await subtle.importKey(
            PRIVATE_KEY_ALGORITHM,
            privateKeyBuffer,
            { name: "RSA-OAEP", hash: "SHA-256" },
            true,
            ["decrypt"]
        ));
    }

    async decode(data: string) : Promise<string> {
        const decryptedChunks: Promise<string>[] = [];

        for (const encryptedChunk of data.split(":")) {
            decryptedChunks.push(subtle.decrypt(
                {
                    name: "RSA-OAEP"
                },
                this.base,
                base64ToArrayBuffer(encryptedChunk)
            ).then((decrypted) => new TextDecoder().decode(decrypted)));
        }
    
        return Promise.all(decryptedChunks).then((chunks) => chunks.join(""));
    }
}

async function generateKeyPair() : Promise<{publicKey: CryptoKey, privateKey: CryptoKey}> {
    return subtle.generateKey(
        {
            name: "RSA-OAEP",
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: "SHA-256"
        },
        true,
        ["encrypt", "decrypt"]
    );
}

export async function generateUserKeyPair(): Promise<{publicKey: UserPublicKey, privateKey: UserPrivateKey}> {
    const { publicKey, privateKey } = await generateKeyPair();

    return {
        publicKey: new UserPublicKey(publicKey),
        privateKey: new UserPrivateKey(privateKey)
    };
}

export async function generateGroupUserKeyPair(): Promise<{publicKey: GroupUserPublicKey, privateKey: GroupUserPrivateKey}> {
    const { publicKey, privateKey } = await generateKeyPair();

    return {
        publicKey: new GroupUserPublicKey(publicKey),
        privateKey: new GroupUserPrivateKey(privateKey)
    };
}

export class UserPublicKey extends PublicKey {
    static async import(encodeKey: string) : Promise<UserPublicKey> {
        return await PublicKey.import(encodeKey) as UserPublicKey;
    }
}

export class UserPrivateKey extends PrivateKey {
    static async import(encodeKey: string) : Promise<UserPrivateKey> {
        const key = await PrivateKey.import(encodeKey);
        return new UserPrivateKey(key.base);
    }

    async encryptWithDerived(key: DerivedKey) : Promise<string> {
        const exported = await this.export();
        const iv = getRandomValues(new Uint8Array(12));
        const ciphertext = await subtle.encrypt(
            {
                name: "AES-GCM",
                iv: iv
            },
            key.base,
            base64ToArrayBuffer(exported)
        );

        return `${arrayBufferToBase64(iv)}:${arrayBufferToBase64(ciphertext)}`;
    }

    static async decryptWithDerived(data: string, key: DerivedKey) : Promise<UserPrivateKey> {
        const [iv, ciphertext] = data.split(":").map(base64ToArrayBuffer);

        const decrypted = await subtle.decrypt(
            {
                name: "AES-GCM",
                iv: iv
            },
            key.base,
            ciphertext
        );

        return UserPrivateKey.import(arrayBufferToBase64(decrypted));
    }

    async decryptGroupUserPrivateKey(data: string) : Promise<GroupUserPrivateKey> {
        return this.decode(data)
            .then((a) => GroupUserPrivateKey.import(a));
    }

    async decryptGroupUserPublicKey(data: string) : Promise<GroupUserPublicKey> {
        return this.decode(data)
            .then((a) => GroupUserPublicKey.import(a));
    }

}

export class GroupUserPublicKey extends PublicKey {
    static async import(encodeKey: string) : Promise<GroupUserPublicKey> {
        const key = await PublicKey.import(encodeKey);
        return new GroupUserPublicKey(key.base);
    }

    async encrypt(key: UserPublicKey) : Promise<string> {
        const data = await this.export();

        const encryptedChunks: Promise<string>[] = [];
        let offset = 0;
        const chunkSize = 190; // 2048-bit key size - 42 bytes
        while (offset < data.length) {
            const chunk = data.slice(offset, offset + chunkSize);

            encryptedChunks.push(subtle.encrypt(
                {
                    name: "RSA-OAEP"
                },
                key.base,
                new TextEncoder().encode(chunk)
            ).then((encrypted) => arrayBufferToBase64(encrypted)));

            offset += chunkSize;
        }

        return Promise.all(encryptedChunks)
            .then((a) => a.join(":"));
    }
}

export class GroupUserPrivateKey extends PrivateKey {
    static async import(encodeKey: string) : Promise<GroupUserPrivateKey> {
        const key = await PrivateKey.import(encodeKey);
        return new GroupUserPrivateKey(key.base);
    }

    async encrypt(key: UserPublicKey) : Promise<string> {
        const data = await this.export();

        const encryptedChunks: Promise<string>[] = [];
        let offset = 0;
        const chunkSize = 190; // 2048-bit key size - 42 bytes
        while (offset < data.length) {
            const chunk = data.slice(offset, offset + chunkSize);
    
            encryptedChunks.push(subtle.encrypt(
                {
                    name: "RSA-OAEP"
                },
                key.base,
                new TextEncoder().encode(chunk)
            ).then((encrypted) => arrayBufferToBase64(encrypted)));

            offset += chunkSize;
        }
    
        return Promise.all(encryptedChunks)
            .then((a) => a.join(":"));
    }
}