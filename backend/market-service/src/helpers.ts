import { basePriceByTicker, historyLimit, port, tickers } from "./config";
import { currentPrice, history } from "./state";

// Keep JSON response shape consistent across all handlers.
export function sendJson(res: HttpResponse, statusCode: number, payload: unknown): void {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(payload));
}

export function getRequestUrl(req: HttpRequest): URL {
  return new URL(req.url || "/", `http://${req.headers.host || `localhost:${port}`}`);
}

export function isTicker(value: string): value is MarketTicker {
  return tickers.includes(value as MarketTicker);
}

export function getHistory(ticker: MarketTicker): PricePoint[] {
  return history.get(ticker) || [];
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
