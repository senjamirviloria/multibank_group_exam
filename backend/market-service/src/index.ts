import http from "http";

const port = Number(process.env.PORT) || 4002;

function sendJson(res: HttpResponse, statusCode: number, payload: unknown): void {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(payload));
}

const server = http.createServer((req: HttpRequest, res: HttpResponse) => {
  if (req.method === "GET" && req.url === "/") {
    const response: MarketHealthResponse = { service: "market-service", status: "ok" };
    sendJson(res, 200, response);
    return;
  }

  sendJson(res, 404, { error: "Not found" });
});

server.listen(port, () => {
  console.log(`market-service running on port ${port}`);
});
