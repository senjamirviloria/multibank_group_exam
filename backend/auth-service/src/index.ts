import http, { IncomingMessage, ServerResponse } from "http";
import jwt, { JwtPayload } from "jsonwebtoken";

const port = Number(process.env.PORT) || 4001;
const jwtSecret = process.env.JWT_SECRET || "dev-secret-change-me";
const allowedOrigin = process.env.CORS_ORIGIN || "http://localhost:3110";

type MockUser = {
  id: string;
  email: string;
  name: string;
};

type LoginRequestBody = {
  email?: string;
  password?: string;
};

type AuthTokenPayload = JwtPayload & {
  sub: string;
  email: string;
  name: string;
};

const mockUser: MockUser = {
  id: "user-1",
  email: "demo@multibank.local",
  name: "Demo User",
};

function sendJson(res: ServerResponse, statusCode: number, payload: unknown): void {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
  });
  res.end(JSON.stringify(payload));
}

function parseJsonBody(req: IncomingMessage): Promise<LoginRequestBody> {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk: Buffer) => {
      body += chunk.toString();
      if (body.length > 1e6) {
        req.socket.destroy();
        reject(new Error("Request body too large"));
      }
    });

    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body) as LoginRequestBody);
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });

    req.on("error", reject);
  });
}

function getBearerToken(req: IncomingMessage): string | null {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    return null;
  }
  return token;
}

const server = http.createServer(async (req: IncomingMessage, res: ServerResponse) => {
  if (!req.url) {
    sendJson(res, 400, { error: "Bad request" });
    return;
  }

  if (req.method === "OPTIONS") {
    sendJson(res, 204, {});
    return;
  }

  if (req.method === "GET" && req.url === "/") {
    sendJson(res, 200, { service: "auth-service", status: "ok" });
    return;
  }

  if (req.method === "POST" && req.url === "/auth/login") {
    try {
      const { email, password } = await parseJsonBody(req);

      if (!email || !password) {
        sendJson(res, 400, { error: "Email and password are required" });
        return;
      }

      const accessToken = jwt.sign(
        {
          sub: mockUser.id,
          email,
          name: mockUser.name,
        },
        jwtSecret,
        { expiresIn: "1h" }
      );

      sendJson(res, 200, {
        tokenType: "Bearer",
        accessToken,
        expiresIn: 3600,
        user: {
          ...mockUser,
          email,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid request";
      sendJson(res, 400, { error: message });
    }
    return;
  }

  if (req.method === "GET" && req.url === "/auth/currentuser") {
    const token = getBearerToken(req);

    if (!token) {
      sendJson(res, 401, { error: "Missing Bearer token" });
      return;
    }

    try {
      const payload = jwt.verify(token, jwtSecret) as AuthTokenPayload;
      sendJson(res, 200, {
        user: {
          id: payload.sub,
          email: payload.email,
          name: payload.name,
        },
      });
    } catch {
      sendJson(res, 401, { error: "Invalid or expired token" });
    }
    return;
  }

  sendJson(res, 404, { error: "Not found" });
});

server.listen(port, () => {
  console.log(`auth-service running on port ${port}`);
});
