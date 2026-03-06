type MarketTicker = "AAPL" | "TSLA" | "BTC-USD" | (string & {});

type MarketPricePoint = {
  ticker: MarketTicker;
  price: number;
  timestamp: string;
};

type MarketLiveTicker = {
  symbol: MarketTicker;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  lastUpdated: string;
};

type MarketTickersResponse = {
  tickers: MarketTicker[];
};

type MarketHistoryResponse = {
  ticker: MarketTicker;
  prices: MarketPricePoint[];
};

type MarketWsMessage = {
  type: string;
  payload: unknown;
};
