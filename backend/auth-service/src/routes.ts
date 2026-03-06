import { currentUserController, loginController } from "./controllers/auth-controller";
import { getHealthController } from "./controllers/system-controller";
import { sendJson } from "./lib/http-utils";

export async function routeRequest(req: HttpRequest, res: HttpResponse): Promise<void> {
  if (!req.url) {
    sendJson(res, 400, { error: "Bad request" });
    return;
  }

  if (req.method === "OPTIONS") {
    sendJson(res, 204, {});
    return;
  }

  if (req.method === "GET" && req.url === "/") {
    getHealthController(req, res);
    return;
  }

  if (req.method === "POST" && req.url === "/auth/login") {
    await loginController(req, res);
    return;
  }

  if (req.method === "GET" && req.url === "/auth/currentuser") {
    currentUserController(req, res);
    return;
  }

  sendJson(res, 404, { error: "Not found" });
}
