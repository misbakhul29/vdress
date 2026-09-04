import sjcl from "sjcl";

const DEFAULT_SECRET = "virtualdressing";

/**
 * Resolves the active encryption key across client and server environments.
 */
export function getSecretKey(): string {
  return (
    process.env.NEXT_PUBLIC_SJCL_PASSWORD ||
    process.env.SJCL_PASSWORD ||
    DEFAULT_SECRET
  );
}

/**
 * Encrypts an object or string payload using SJCL AES-CCM.
 */
export function encryptData(data: unknown, customKey?: string): string {
  const key = customKey || getSecretKey();
  const payload = typeof data === "string" ? data : JSON.stringify(data);
  return sjcl.encrypt(key, payload) as unknown as string;
}

/**
 * Decrypts an SJCL AES-CCM ciphertext and parses it if JSON.
 */
export function decryptData<T = any>(cipherText: string, customKey?: string): T {
  const key = customKey || getSecretKey();
  const decrypted = sjcl.decrypt(key, cipherText);
  try {
    return JSON.parse(decrypted) as T;
  } catch {
    return decrypted as unknown as T;
  }
}
