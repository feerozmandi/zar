/**
 * هش و راستی‌آزمایی گذرواژه — تنها پیاده‌سازی مجاز در کل مونورپو.
 * الگوریتم: scrypt (N=2^15, r=8, p=1) تا وابستگی native (bcrypt/argon2) لازم نباشد.
 */
import { randomBytes, scrypt as _scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(_scrypt) as (password: string, salt: Buffer, keylen: number) => Promise<Buffer>;

const KEY_LENGTH = 64;
const SCHEMA = "scrypt";

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, KEY_LENGTH);
  return `${SCHEMA}$${salt.toString("hex")}$${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [schema, saltHex, hashHex] = stored.split("$");
  if (schema !== SCHEMA || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  if (expected.byteLength !== KEY_LENGTH) return false;
  const derived = await scrypt(password, Buffer.from(saltHex, "hex"), KEY_LENGTH);
  return timingSafeEqual(derived, expected);
}
