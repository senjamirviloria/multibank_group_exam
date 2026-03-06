import { tickIntervalMs, tickers } from "./config";
import { generateUpdate } from "./helpers";

export function startMarketFeed(): void {
  // Keep generating in-memory prices so history endpoints stay fresh.
  setInterval(() => {
    for (const ticker of tickers) {
      generateUpdate(ticker);
    }
  }, tickIntervalMs);
}
