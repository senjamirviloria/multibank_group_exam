import http from "http";
import { port } from "./config";
import { broadcastPriceUpdate } from "./helpers";
import { startMarketFeed } from "./market-feed";
import { routeHttpRequest } from "./rest-handlers";
import { wireWebSocketServer } from "./websocket";

// Keep entrypoint minimal: wire transports, start feed, then listen.
const server = http.createServer(routeHttpRequest);

wireWebSocketServer(server);
startMarketFeed(broadcastPriceUpdate);

server.listen(port, () => {
  console.log(`market-service running on port ${port}`);
});
