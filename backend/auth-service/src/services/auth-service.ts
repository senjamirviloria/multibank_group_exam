import jwt from "jsonwebtoken";
import { jwtSecret, mockPassword, mockUsername } from "../config";

export function isValidCredentials(email: string, password: string): boolean {
  return email === mockUsername && password === mockPassword;
}

export function createAccessToken(user: MockUser): string {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      name: user.name,
    },
    jwtSecret,
    { expiresIn: "1h" }
  );
}

export function verifyAccessToken(token: string): AuthTokenPayload | null {
  try {
    return jwt.verify(token, jwtSecret) as AuthTokenPayload;
  } catch {
    return null;
  }
}
