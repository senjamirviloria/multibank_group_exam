// Keep runtime knobs here so service behavior is easy to tune in one place.
export const port = Number(process.env.PORT) || 4002;
export const historyLimit = 500;
export const tickIntervalMs = 1000;
export const wsPath = "/ws";
export const allowedOrigin = process.env.CORS_ORIGIN || "http://localhost:3110";

export const tickers: MarketTicker[] = ["AAPL", "TSLA", "BTC-USD"];

// Baseline prices + volatility drive the mock random-walk market simulation.
export const basePriceByTicker: Record<MarketTicker, { price: number; volatility: number }> = {
  AAPL: { price: 190, volatility: 0.004 },
  TSLA: { price: 220, volatility: 0.008 },
  "BTC-USD": { price: 62000, volatility: 0.012 },
};
