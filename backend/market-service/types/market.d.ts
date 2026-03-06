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

type WsEnvelope<TType extends string, TPayload> = {
  type: TType;
  payload: TPayload;
};

type WsSubscriptionMessage = {
  action: "subscribe" | "unsubscribe";
  tickers: MarketTicker[];
};
