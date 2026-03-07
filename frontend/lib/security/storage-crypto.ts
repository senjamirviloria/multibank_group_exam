"use client";

import CryptoJS from "crypto-js";

const LOCAL_CACHE_SECRET =
  process.env.NEXT_PUBLIC_LOCAL_CACHE_SECRET || "multibank-local-cache-secret";

export function encryptObject(payload: unknown): string {
  const serialized = JSON.stringify(payload);
  return CryptoJS.AES.encrypt(serialized, LOCAL_CACHE_SECRET).toString();
}

export function decryptObject<T>(encrypted: string): T | null {
  try {
    const bytes = CryptoJS.AES.decrypt(encrypted, LOCAL_CACHE_SECRET);
    const plaintext = bytes.toString(CryptoJS.enc.Utf8);
    if (!plaintext) {
      return null;
    }
    return JSON.parse(plaintext) as T;
  } catch {
    return null;
  }
}
