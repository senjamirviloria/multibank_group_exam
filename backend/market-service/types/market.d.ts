type MarketTicker = "AAPL" | "TSLA" | "BTC-USD";

type PricePoint = {
  ticker: MarketTicker;
  price: number;
  timestamp: string;
};

type MarketHealthResponse = ApiStatus & {
  service: "market-service";
};

type TickersResponse = {
  tickers: MarketTicker[];
};

type PriceHistoryResponse = {
  ticker: MarketTicker;
  prices: PricePoint[];
};
