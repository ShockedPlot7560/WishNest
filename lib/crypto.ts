import { getRandomValues, subtle } from "crypto";
import {
    DerivedKey, UserPublicKey, UserPrivateKey,
    DERIVED_KEY_ALGORITHM,
    PRIVATE_KEY_ALGORITHM,
    PrivateKey,
    PUBLIC_KEY_ALGORITHM,
    PublicKey,
    USER_PRIVATE_KEY_ALGORITHM, USER_PUBLIC_KEY_ALGORITHM
} from "./types";

// Convert ArrayBuffer to Base64 string
function arrayBufferToBase64(buffer: ArrayBuffer): string {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

// Convert Base64 string to ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
    return Uint8Array.from(atob(base64), c => c.charCodeAt(0)).buffer;
}

// Génération d'un sel aléatoire
async function generateSalt(): Promise<string> {
    const salt = getRandomValues(new Uint8Array(16)); // 128-bit salt
    return arrayBufferToBase64(salt);
}

async function deriveKey(password: string, saltBase64: string): Promise<DerivedKey> {
    const salt = base64ToArrayBuffer(saltBase64);

    // Importer le mot de passe comme clé brute
    const passwordKey = await subtle.importKey(
        "raw",
        new TextEncoder().encode(password),
        DERIVED_KEY_ALGORITHM,
        false,
        ["deriveKey"]
    );

    // Dériver une clé AES-GCM à partir du mot de passe et du sel
    return await subtle.deriveKey(
        {
            name: DERIVED_KEY_ALGORITHM,
            salt: salt,
            iterations: 100000, // Augmentez pour plus de sécurité
            hash: "SHA-256"
        },
        passwordKey,
        { name: "AES-GCM", length: 256 }, // Clé AES-256
        true,
        ["encrypt", "decrypt"]
    ) as DerivedKey;
}

export interface EncryptedData {
    ciphertext: string;
    iv: string;
}

async function encryptPrivateKey(privateKey: PrivateKey, derivedKey: DerivedKey): Promise<EncryptedData> {
    const iv = getRandomValues(new Uint8Array(12)); // Vecteur d'initialisation aléatoire
    const exportedPrivateKey = await subtle.exportKey(PRIVATE_KEY_ALGORITHM, privateKey); // Exporter la clé privée en PKCS8

    const ciphertext = await subtle.encrypt(
        {
            name: "AES-GCM",
            iv: iv
        },
        derivedKey,
        exportedPrivateKey // Convertir la clé privée en ArrayBuffer
    );

    return {
        ciphertext: arrayBufferToBase64(ciphertext),
        iv: arrayBufferToBase64(iv)
    };
}

async function encryptPublicKey(publicKey: PublicKey, derivedKey: DerivedKey): Promise<EncryptedData> {
    const iv = getRandomValues(new Uint8Array(12)); // Vecteur d'initialisation aléatoire
    const exportedPublicKey = await subtle.exportKey(PUBLIC_KEY_ALGORITHM, publicKey); // Exporter la clé publique en SPKI

    const ciphertext = await subtle.encrypt(
        {
            name: "AES-GCM",
            iv: iv
        },
        derivedKey,
        exportedPublicKey // Convertir la clé publique en ArrayBuffer
    );

    return {
        ciphertext: arrayBufferToBase64(ciphertext),
        iv: arrayBufferToBase64(iv)
    };
}

async function decryptPrivateKey(encryptedData: EncryptedData, derivedKey: DerivedKey): Promise<CryptoKey> {
    const { ciphertext, iv } = encryptedData;

    const decrypted = await subtle.decrypt(
        {
            name: "AES-GCM",
            iv: base64ToArrayBuffer(iv)
        },
        derivedKey,
        base64ToArrayBuffer(ciphertext)
    );

    return await subtle.importKey(
        PRIVATE_KEY_ALGORITHM,
        decrypted,
        { name: "RSA-OAEP", hash: "SHA-256" },
        true,
        ["decrypt"]
    );
}

export async function exportPrivateKey(privateKey: PrivateKey): Promise<string> {
    const exportedPrivateKey = await subtle.exportKey(PRIVATE_KEY_ALGORITHM, privateKey);
    return arrayBufferToBase64(exportedPrivateKey);
}

export async function importPrivateKey(privateKey: string): Promise<PrivateKey> {
    const privateKeyBuffer = base64ToArrayBuffer(privateKey);
    return await subtle.importKey(
        PRIVATE_KEY_ALGORITHM,
        privateKeyBuffer,
        { name: "RSA-OAEP", hash: "SHA-256" },
        true,
        ["decrypt"]
    );
}

export async function exportPublicKey(publicKey: PublicKey): Promise<string> {
    const exportedPublicKey = await subtle.exportKey(PUBLIC_KEY_ALGORITHM, publicKey);
    return arrayBufferToBase64(exportedPublicKey);
}

export async function importPublicKey(publicKey: string): Promise<PublicKey> {
    const publicKeyBuffer = base64ToArrayBuffer(publicKey);
    return await subtle.importKey(
        PUBLIC_KEY_ALGORITHM,
        publicKeyBuffer,
        { name: "RSA-OAEP", hash: "SHA-256" },
        true,
        ["encrypt"]
    );
}

async function decryptPublicKey(encryptedData: EncryptedData, derivedKey: DerivedKey): Promise<PublicKey> {
    const { ciphertext, iv } = encryptedData;

    const decrypted = await subtle.decrypt(
        {
            name: "AES-GCM",
            iv: base64ToArrayBuffer(iv)
        },
        derivedKey,
        base64ToArrayBuffer(ciphertext)
    );

    return await subtle.importKey(
        PUBLIC_KEY_ALGORITHM,
        decrypted,
        { name: "RSA-OAEP", hash: "SHA-256" },
        true,
        ["encrypt"]
    );
}

async function generatePrimaryKeyPair(): Promise<CryptoKeyPair> {
    return await subtle.generateKey(
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

async function encryptPrivateData(data: string, publicKey: PublicKey): Promise<string> {
    const encryptedChunks: string[] = [];
    let offset = 0;
    const chunkSize = 190; // 2048-bit key size - 42 bytes
    while (offset < data.length) {
        const chunk = data.slice(offset, offset + chunkSize);
        const encrypted = await subtle.encrypt(
            {
                name: "RSA-OAEP"
            },
            publicKey,
            new TextEncoder().encode(chunk)
        );

        encryptedChunks.push(arrayBufferToBase64(encrypted));
        offset += chunkSize;
    }

    return encryptedChunks.join(":");
}

async function decryptPrivateData(data: string, privateKey: PrivateKey): Promise<string> {
    const encryptedChunks = data.split(":");
    const decryptedChunks: string[] = [];
    for (const encryptedChunk of encryptedChunks) {
        const decrypted = await subtle.decrypt(
            {
                name: "RSA-OAEP"
            },
            privateKey,
            base64ToArrayBuffer(encryptedChunk)
        );

        decryptedChunks.push(new TextDecoder().decode(decrypted));
    }

    return decryptedChunks.join("");

}

async function derivedKeyFromB64(key: string): Promise<DerivedKey> {
    return await subtle.importKey(
        "raw",
        base64ToArrayBuffer(key),
        { name: "AES-GCM" }, // Utilisez le bon algorithme ici
        false,
        ["encrypt", "decrypt"] // Usages compatibles avec AES-GCM
    );
}

async function derivedKeyToB64(key: DerivedKey): Promise<string> {
    const exported = await subtle.exportKey("raw", key);
    return arrayBufferToBase64(exported);
}

export { generateSalt, deriveKey, generatePrimaryKeyPair, encryptPrivateKey, decryptPrivateKey, encryptPrivateData, decryptPrivateData, derivedKeyFromB64, derivedKeyToB64, encryptPublicKey, decryptPublicKey };

export async function encryptInvitationData(data: string, passphrase: string): Promise<string> {
    const salt = await generateSalt();
    const derivedKey = await deriveKey(passphrase, salt);
    const iv = getRandomValues(new Uint8Array(12)); // Vecteur d'initialisation aléatoire

    const encrypted = await subtle.encrypt(
        {
            name: "AES-GCM",
            iv: iv
        },
        derivedKey,
        new TextEncoder().encode(data)
    );

    return `${salt}:${arrayBufferToBase64(iv)}:${arrayBufferToBase64(encrypted)}`;
}

export async function decryptInvitationData(data: string, passphrase: string): Promise<string> {
    const [salt, iv, ciphertext] = data.split(":").map(base64ToArrayBuffer);
    const derivedKey = await deriveKey(passphrase, arrayBufferToBase64(salt));

    const decrypted = await subtle.decrypt(
        {
            name: "AES-GCM",
            iv: iv
        },
        derivedKey,
        ciphertext
    );

    return new TextDecoder().decode(decrypted);
}

export async function generateUserKeyPair(): Promise<CryptoKeyPair> {
    const keyPair = await subtle.generateKey(
        {
            name: "RSA-OAEP",
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: "SHA-256"
        },
        true,
        ["encrypt", "decrypt"]
    );

    return keyPair;
}

export async function encryptPrivateKeyUser(privateKey: UserPrivateKey, derivedKey: DerivedKey) : Promise<string> {
    const exportedPrivateKey = await subtle.exportKey(USER_PRIVATE_KEY_ALGORITHM, privateKey);
    const iv = getRandomValues(new Uint8Array(12));
    const ciphertext = await subtle.encrypt(
        {
            name: "AES-GCM",
            iv: iv
        },
        derivedKey,
        exportedPrivateKey
    );

    return `${arrayBufferToBase64(iv)}:${arrayBufferToBase64(ciphertext)}`;
}

export async function decryptPrivateKeyUser(encryptedPrivateKey: string, derivedKey: DerivedKey): Promise<UserPrivateKey> {
    const [iv, ciphertext] = encryptedPrivateKey.split(":").map(base64ToArrayBuffer);

    const decrypted = await subtle.decrypt(
        {
            name: "AES-GCM",
            iv: iv
        },
        derivedKey,
        ciphertext
    );

    return await subtle.importKey(
        USER_PRIVATE_KEY_ALGORITHM,
        decrypted,
        { name: "RSA-OAEP", hash: "SHA-256" },
        true,
        ["decrypt"]
    );
}

export async function encryptUserPrivateData(data: string, publicKey: UserPublicKey): Promise<string> {
    const encryptedChunks: string[] = [];
    let offset = 0;
    const chunkSize = 190; // 2048-bit key size - 42 bytes
    while (offset < data.length) {
        const chunk = data.slice(offset, offset + chunkSize);
        const encrypted = await subtle.encrypt(
            {
                name: "RSA-OAEP"
            },
            publicKey,
            new TextEncoder().encode(chunk)
        );

        encryptedChunks.push(arrayBufferToBase64(encrypted));
        offset += chunkSize;
    }

    return encryptedChunks.join(":");
}

export async function decryptUserPrivateData(data: string, privateKey: UserPrivateKey): Promise<string> {
    const encryptedChunks = data.split(":");
    const decryptedChunks: string[] = [];
    for (const encryptedChunk of encryptedChunks) {
        const decrypted = await subtle.decrypt(
            {
                name: "RSA-OAEP"
            },
            privateKey,
            base64ToArrayBuffer(encryptedChunk)
        );

        decryptedChunks.push(new TextDecoder().decode(decrypted));
    }

    return decryptedChunks.join("");
}

export async function exportUserPublicKey(publicKey: UserPublicKey): Promise<string> {
    const exportedPublicKey = await subtle.exportKey(USER_PUBLIC_KEY_ALGORITHM, publicKey);
    return arrayBufferToBase64(exportedPublicKey);
}

export async function importUserPublicKey(publicKey: string): Promise<UserPublicKey> {
    const publicKeyBuffer = base64ToArrayBuffer(publicKey);
    return await subtle.importKey(
        USER_PUBLIC_KEY_ALGORITHM,
        publicKeyBuffer,
        { name: "RSA-OAEP", hash: "SHA-256" },
        true,
        ["encrypt"]
    );
}

export async function encryptGroupUserPrivateKey(privateKey: PrivateKey, publicKey: UserPublicKey) : Promise<string> {
    const data = await exportPrivateKey(privateKey);

    const encryptedChunks: string[] = [];
    let offset = 0;
    const chunkSize = 190; // 2048-bit key size - 42 bytes
    while (offset < data.length) {
        const chunk = data.slice(offset, offset + chunkSize);
        const encrypted = await subtle.encrypt(
            {
                name: "RSA-OAEP"
            },
            publicKey,
            new TextEncoder().encode(chunk)
        );

        encryptedChunks.push(arrayBufferToBase64(encrypted));
        offset += chunkSize;
    }

    return encryptedChunks.join(":");
}

export async function decryptGroupUserPrivateKey(data: string, privateKey: UserPrivateKey): Promise<PrivateKey> {
    const encryptedChunks = data.split(":");
    const decryptedChunks: string[] = [];
    for (const encryptedChunk of encryptedChunks) {
        const decrypted = await subtle.decrypt(
            {
                name: "RSA-OAEP"
            },
            privateKey,
            base64ToArrayBuffer(encryptedChunk)
        );

        decryptedChunks.push(new TextDecoder().decode(decrypted));
    }

    return importPrivateKey(decryptedChunks.join(""));
}

export async function encryptGroupUserPublicKey(publicKey: PublicKey, userPublicKey: UserPublicKey) : Promise<string> {
    const data = await exportPublicKey(publicKey);

    const encryptedChunks: string[] = [];
    let offset = 0;
    const chunkSize = 190; // 2048-bit key size - 42 bytes
    while (offset < data.length) {
        const chunk = data.slice(offset, offset + chunkSize);
        const encrypted = await subtle.encrypt(
            {
                name: "RSA-OAEP"
            },
            userPublicKey,
            new TextEncoder().encode(chunk)
        );

        encryptedChunks.push(arrayBufferToBase64(encrypted));
        offset += chunkSize;
    }

    return encryptedChunks.join(":");
}

export async function decryptGroupUserPublicKey(data: string, privateKey: UserPrivateKey): Promise<PublicKey> {
    const encryptedChunks = data.split(":");
    const decryptedChunks: string[] = [];
    for (const encryptedChunk of encryptedChunks) {
        const decrypted = await subtle.decrypt(
            {
                name: "RSA-OAEP"
            },
            privateKey,
            base64ToArrayBuffer(encryptedChunk)
        );

        decryptedChunks.push(new TextDecoder().decode(decrypted));
    }

    return importPublicKey(decryptedChunks.join(""));
}