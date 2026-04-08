export const SESSION_COOKIE_NAME = "tuketim_session";
export const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7;

function encodeBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeBase64Url(s: string): Uint8Array {
  let base64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4;
  if (pad) base64 += "=".repeat(4 - pad);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function bufToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacSha256Hex(secret: string, messageBytes: Uint8Array): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const payload = new Uint8Array(messageBytes.byteLength);
  payload.set(messageBytes);
  const sig = await crypto.subtle.sign("HMAC", key, payload);
  return bufToHex(sig);
}

export function getAuthSecret(): string {
  const s = process.env.APP_AUTH_SECRET;
  if (!s?.trim()) {
    throw new Error("APP_AUTH_SECRET eksik");
  }
  return s;
}

export async function createSessionToken(username: string, secret: string): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SEC;
  const payload = JSON.stringify({ u: username, exp });
  const payloadBytes = new TextEncoder().encode(payload);
  const payloadB64 = encodeBase64Url(payloadBytes);
  const enc = new TextEncoder();
  const sig = (await hmacSha256Hex(secret, enc.encode(payloadB64))).toLowerCase();
  return `${payloadB64}.${sig}`;
}

export async function verifySessionToken(token: string, secret: string): Promise<string | null> {
  const i = token.lastIndexOf(".");
  if (i <= 0) return null;
  const payloadB64 = token.slice(0, i);
  const sigHex = token.slice(i + 1).toLowerCase();
  const enc = new TextEncoder();
  const expected = (await hmacSha256Hex(secret, enc.encode(payloadB64))).toLowerCase();
  if (sigHex.length !== expected.length) return null;
  let diff = 0;
  for (let j = 0; j < sigHex.length; j++) {
    diff |= sigHex.charCodeAt(j) ^ expected.charCodeAt(j);
  }
  if (diff !== 0) return null;
  let json: string;
  try {
    json = new TextDecoder().decode(decodeBase64Url(payloadB64));
  } catch {
    return null;
  }
  let payload: { u?: string; exp?: number };
  try {
    payload = JSON.parse(json) as { u?: string; exp?: number };
  } catch {
    return null;
  }
  if (!payload?.u || typeof payload.exp !== "number") return null;
  if (payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload.u;
}
