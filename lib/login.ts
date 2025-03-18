import { hash, verify } from 'argon2';

async function hashPassword(password: string): Promise<string> {
    return await hash(password);
}

async function checkPassword(password: string, hash: string): Promise<boolean> {
    return verify(hash, password);
}

export { hashPassword, checkPassword };