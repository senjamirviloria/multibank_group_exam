import http from "http";
import { port } from "./config";
import { startMarketFeed } from "./market-feed";
import { routeHttpRequest } from "./rest-handlers";

// Keep entrypoint minimal: wire HTTP, start feed, then listen.
const server = http.createServer(routeHttpRequest);

startMarketFeed();

server.listen(port, () => {
  console.log(`market-service running on port ${port}`);
});
