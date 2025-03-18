
export type DerivedKey = CryptoKey
export type UserPublicKey = PublicKey
export type UserPrivateKey = PrivateKey
export type PrivateKey = CryptoKey
export type PublicKey = CryptoKey

export const DERIVED_KEY_ALGORITHM = "PBKDF2";
export const PRIVATE_KEY_ALGORITHM = "pkcs8";
export const PUBLIC_KEY_ALGORITHM = "spki";
export const USER_PRIVATE_KEY_ALGORITHM = "pkcs8";
export const USER_PUBLIC_KEY_ALGORITHM = "spki";