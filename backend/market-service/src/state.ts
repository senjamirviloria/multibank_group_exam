import { WebSocket } from "ws";
import { basePriceByTicker, tickers } from "./config";

// In-memory service state; fine for mock/demo mode and easy to reset.
export const currentPrice = new Map<MarketTicker, number>();
export const history = new Map<MarketTicker, PricePoint[]>();
export const subscriptions = new Map<WebSocket, Set<MarketTicker>>();

// Seed startup prices so REST has immediate data.
for (const ticker of tickers) {
  currentPrice.set(ticker, basePriceByTicker[ticker].price);
  history.set(ticker, []);
}
