import { sendJson } from "../lib/http-utils";

export function getHealthController(_req: HttpRequest, res: HttpResponse): void {
  sendJson(res, 200, { service: "auth-service", status: "ok" });
}
