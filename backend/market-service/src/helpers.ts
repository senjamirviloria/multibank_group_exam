import { WebSocket } from "ws";
import { allowedOrigin, basePriceByTicker, historyLimit, port, tickers } from "./config";
import { currentPrice, history, subscriptions } from "./state";

// Keep JSON response shape consistent across all handlers.
export function sendJson(res: HttpResponse, statusCode: number, payload: unknown): void {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
  });
  res.end(JSON.stringify(payload));
}

export function getRequestUrl(req: HttpRequest): URL {
  return new URL(req.url || "/", `http://${req.headers.host || `localhost:${port}`}`);
}

export function isTicker(value: string): value is MarketTicker {
  return tickers.includes(value as MarketTicker);
}

export function parseTickerList(rawValue: string | null): MarketTicker[] {
  if (!rawValue) {
    // Default subscription is all tickers for convenience.
    return [...tickers];
  }

  const parsed = rawValue
    .split(",")
    .map((ticker) => ticker.trim().toUpperCase())
    .filter((ticker): ticker is MarketTicker => isTicker(ticker));

  return parsed.length ? parsed : [...tickers];
}

export function getHistory(ticker: MarketTicker): PricePoint[] {
  return history.get(ticker) || [];
}

export function getLatestPoints(selectedTickers: MarketTicker[]): PricePoint[] {
  return selectedTickers
    .map((ticker) => {
      const prices = getHistory(ticker);
      return prices[prices.length - 1];
    })
    .filter((point): point is PricePoint => Boolean(point));
}

function applyRandomWalk(previous: number, volatility: number): number {
  const drift = (Math.random() * 2 - 1) * volatility;
  return Number((previous * (1 + drift)).toFixed(2));
}

function pushHistory(point: PricePoint): void {
  const series = history.get(point.ticker);
  if (!series) {
    return;
  }

  series.push(point);
  // Keep memory bounded; this is a stream, not long-term storage.
  if (series.length > historyLimit) {
    series.shift();
  }
}

export function generateUpdate(ticker: MarketTicker): PricePoint {
  const current = currentPrice.get(ticker) ?? basePriceByTicker[ticker].price;
  const next = applyRandomWalk(current, basePriceByTicker[ticker].volatility);
  currentPrice.set(ticker, next);

  const point: PricePoint = {
    ticker,
    price: next,
    timestamp: new Date().toISOString(),
  };

  pushHistory(point);
  return point;
}

export function sendWsMessage<TType extends string, TPayload>(
  ws: WebSocket,
  message: WsEnvelope<TType, TPayload>
): void {
  ws.send(JSON.stringify(message));
}

export function broadcastPriceUpdate(point: PricePoint): void {
  for (const [client, subscribedTickers] of subscriptions.entries()) {
    if (client.readyState !== WebSocket.OPEN) {
      continue;
    }

    if (!subscribedTickers.has(point.ticker)) {
      continue;
    }

    sendWsMessage(client, { type: "price.update", payload: point });
  }
}

export function handleSubscriptionMessage(ws: WebSocket, rawMessage: unknown): void {
  try {
    const parsed = JSON.parse(String(rawMessage)) as WsSubscriptionMessage;
    if (!parsed?.action || !Array.isArray(parsed.tickers)) {
      return;
    }

    const validTickers = parsed.tickers.filter((ticker): ticker is MarketTicker => isTicker(ticker));
    const currentSubscriptions = subscriptions.get(ws) || new Set<MarketTicker>();

    if (parsed.action === "subscribe") {
      validTickers.forEach((ticker) => currentSubscriptions.add(ticker));
    } else {
      validTickers.forEach((ticker) => currentSubscriptions.delete(ticker));
    }

    subscriptions.set(ws, currentSubscriptions);
    sendWsMessage(ws, {
      type: "subscriptions.updated",
      payload: { tickers: [...currentSubscriptions] },
    });
  } catch {
    sendWsMessage(ws, { type: "error", payload: { message: "Invalid WebSocket message payload" } });
  }
}
