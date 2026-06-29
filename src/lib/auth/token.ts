/** Minimal JWT helpers — decode the payload to read the `exp` claim. */

export interface JwtPayload {
  /** Expiry, seconds since epoch (set by the backend's `expiresIn`). */
  exp?: number;
  iat?: number;
  userId?: string;
  [k: string]: unknown;
}

/** Decode a JWT payload without verifying the signature (client-side only). */
export function decodeJwt(token: string): JwtPayload | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join(""),
    );
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Token expiry as an epoch-ms timestamp, or `null` when it can't be
 * determined — e.g. mock tokens (`mock.jwt.<id>`) that carry no `exp`.
 */
export function getTokenExpMs(token: string | null): number | null {
  if (!token) return null;
  const payload = decodeJwt(token);
  if (!payload || typeof payload.exp !== "number") return null;
  return payload.exp * 1000;
}

/**
 * Whether the token is already expired. Returns `false` when expiry is
 * unknown, so dev/mock sessions are never force-logged-out.
 */
export function isTokenExpired(token: string | null): boolean {
  const exp = getTokenExpMs(token);
  if (exp === null) return false;
  return Date.now() >= exp;
}
