type DashboardViewState = {
  loading: boolean;
  error: string;
};

type DashboardPricePoint = {
  timestamp: string;
  price: number;
};

type MarketHistoryCacheEntry = {
  points: DashboardPricePoint[];
  cachedAt: number;
};

type MarketHistoryCacheMap = Record<string, MarketHistoryCacheEntry>;

type MarketHistoryCacheState = {
  cache: MarketHistoryCacheMap;
  hydrateCache: () => void;
  getTickerHistory: (ticker: MarketTicker, ttlMs: number) => DashboardPricePoint[] | null;
  setTickerHistory: (ticker: MarketTicker, points: DashboardPricePoint[]) => void;
  appendTickerPoint: (ticker: MarketTicker, point: DashboardPricePoint, maxPoints: number) => void;
};
