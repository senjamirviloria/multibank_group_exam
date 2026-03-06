import { historyLimit, tickers } from "./config";
import { getHistory, getRequestUrl, isTicker, sendJson } from "./helpers";

// Health endpoint so upstream services can quickly verify liveness.
function handleRoot(_req: HttpRequest, res: HttpResponse): void {
  const response: MarketHealthResponse = { service: "market-service", status: "ok" };
  sendJson(res, 200, response);
}

// Expose fixed universe for client dropdowns and validation.
function handleTickers(_req: HttpRequest, res: HttpResponse): void {
  const response: TickersResponse = { tickers };
  sendJson(res, 200, response);
}

// Mock historical endpoint backed by in-memory rolling buffers.
function handlePriceHistory(req: HttpRequest, res: HttpResponse): void {
  const requestUrl = getRequestUrl(req);
  const tickerParam = requestUrl.searchParams.get("ticker")?.toUpperCase() || "";

  if (!isTicker(tickerParam)) {
    sendJson(res, 400, { error: "Valid ticker is required (AAPL, TSLA, BTC-USD)" });
    return;
  }

  const limitParam = Number(requestUrl.searchParams.get("limit") || 50);
  const limit = Number.isFinite(limitParam) ? Math.max(1, Math.min(historyLimit, limitParam)) : 50;

  const response: PriceHistoryResponse = {
    ticker: tickerParam,
    prices: getHistory(tickerParam).slice(-limit),
  };

  sendJson(res, 200, response);
}

function handleNotFound(res: HttpResponse): void {
  sendJson(res, 404, { error: "Not found" });
}

export function routeHttpRequest(req: HttpRequest, res: HttpResponse): void {
  const requestUrl = getRequestUrl(req);

  if (req.method === "OPTIONS") {
    sendJson(res, 204, {});
    return;
  }

  if (req.method === "GET" && requestUrl.pathname === "/") {
    handleRoot(req, res);
    return;
  }

  if (req.method === "GET" && requestUrl.pathname === "/tickers") {
    handleTickers(req, res);
    return;
  }

  if (req.method === "GET" && requestUrl.pathname === "/prices/history") {
    handlePriceHistory(req, res);
    return;
  }

  handleNotFound(res);
}
