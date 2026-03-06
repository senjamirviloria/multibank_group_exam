import { mockUser } from "../config";
import { getBearerToken, parseJsonBody, sendJson } from "../lib/http-utils";
import { createAccessToken, isValidCredentials, verifyAccessToken } from "../services/auth-service";

export async function loginController(req: HttpRequest, res: HttpResponse): Promise<void> {
  try {
    const { email, password } = await parseJsonBody<LoginRequestBody>(req);

    if (!email || !password) {
      sendJson(res, 400, { error: "Email and password are required" });
      return;
    }

    if (!isValidCredentials(email, password)) {
      sendJson(res, 401, { error: "Invalid username or password" });
      return;
    }

    const accessToken = createAccessToken(mockUser);

    const response: LoginResponse = {
      tokenType: "Bearer",
      accessToken,
      expiresIn: 3600,
      user: { ...mockUser },
    };

    sendJson(res, 200, response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    sendJson(res, 400, { error: message });
  }
}

export function currentUserController(req: HttpRequest, res: HttpResponse): void {
  const token = getBearerToken(req);

  if (!token) {
    sendJson(res, 401, { error: "Missing Bearer token" });
    return;
  }

  const payload = verifyAccessToken(token);

  if (!payload) {
    sendJson(res, 401, { error: "Invalid or expired token" });
    return;
  }

  const response: CurrentUserResponse = {
    user: {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
    },
  };

  sendJson(res, 200, response);
}
