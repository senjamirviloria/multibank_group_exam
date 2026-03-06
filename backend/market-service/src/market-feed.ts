import { tickIntervalMs, tickers } from "./config";
import { generateUpdate } from "./helpers";

export function startMarketFeed(onTick?: (point: PricePoint) => void): void {
  // Keep generating in-memory prices so history endpoints stay fresh.
  setInterval(() => {
    for (const ticker of tickers) {
      const point = generateUpdate(ticker);
      onTick?.(point);
    }
  }, tickIntervalMs);
}
