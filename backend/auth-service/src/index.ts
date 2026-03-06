import http from "http";
import "dotenv/config";
import { port } from "./config";
import { routeRequest } from "./routes";

const server = http.createServer((req: HttpRequest, res: HttpResponse) => {
  void routeRequest(req, res);
});

server.listen(port, () => {
  console.log(`auth-service running on port ${port}`);
});
