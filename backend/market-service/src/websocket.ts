import type { Server } from "http";
import type { Socket } from "net";
import { WebSocketServer } from "ws";
import { wsPath } from "./config";
import {
  getLatestPoints,
  getRequestUrl,
  handleSubscriptionMessage,
  parseTickerList,
  sendWsMessage,
} from "./helpers";
import { subscriptions } from "./state";

export function wireWebSocketServer(server: Server): void {
  const wsServer = new WebSocketServer({ noServer: true });

  wsServer.on("connection", (ws, req) => {
    const requestUrl = getRequestUrl(req);
    const selectedTickers = parseTickerList(requestUrl.searchParams.get("tickers"));
    subscriptions.set(ws, new Set(selectedTickers));

    sendWsMessage(ws, { type: "subscribed", payload: { tickers: selectedTickers } });
    sendWsMessage(ws, { type: "price.snapshot", payload: getLatestPoints(selectedTickers) });

    ws.on("message", (rawMessage) => {
      handleSubscriptionMessage(ws, rawMessage);
    });

    ws.on("close", () => {
      subscriptions.delete(ws);
    });
  });

  server.on("upgrade", (req, socket: Socket, head) => {
    const requestUrl = getRequestUrl(req);

    if (requestUrl.pathname !== wsPath) {
      socket.destroy();
      return;
    }

    wsServer.handleUpgrade(req, socket, head, (ws) => {
      wsServer.emit("connection", ws, req);
    });
  });
}
