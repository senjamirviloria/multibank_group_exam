import jwt from "jsonwebtoken";
import { jwtSecret } from "./config";

function parseCookieHeader(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) {
    return {};
  }

  return cookieHeader.split(";").reduce<Record<string, string>>((acc, segment) => {
    const [rawKey, ...rest] = segment.trim().split("=");
    if (!rawKey) {
      return acc;
    }

    acc[rawKey] = decodeURIComponent(rest.join("=") || "");
    return acc;
  }, {});
}

export function getBearerToken(req: HttpRequest): string | null {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");
  if (scheme === "Bearer" && token) {
    return token;
  }

  const cookies = parseCookieHeader(req.headers.cookie);
  if (cookies.access_token) {
    return cookies.access_token;
  }

  if (cookies.market_access_token) {
    return cookies.market_access_token;
  }

  return null;
}

export function getUpgradeToken(req: HttpRequest): string | null {
  const requestUrl = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const queryToken = requestUrl.searchParams.get("token");
  if (queryToken) {
    return queryToken;
  }

  return getBearerToken(req);
}

export function verifyAccessToken(token: string): AuthTokenPayload | null {
  try {
    return jwt.verify(token, jwtSecret) as AuthTokenPayload;
  } catch {
    return null;
  }
}
