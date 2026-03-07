"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const MARKET_API_URL = process.env.NEXT_PUBLIC_MARKET_API_URL || "http://localhost:4002";
const MARKET_WS_URL = (() => {
  if (process.env.NEXT_PUBLIC_MARKET_WS_URL) {
    return process.env.NEXT_PUBLIC_MARKET_WS_URL;
  }

  try {
    const parsed = new URL(MARKET_API_URL);
    const protocol = parsed.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${parsed.host}/ws`;
  } catch {
    return "ws://localhost:4002/ws";
  }
})();
const HISTORY_CACHE_TTL_MS = (() => {
  const parsed = Number(process.env.NEXT_PUBLIC_HISTORY_CACHE_TTL_MS || "30000");
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 30000;
})();
const HISTORY_CACHE_STORAGE_KEY = "market_history_cache_v1";

function formatMoney(price: number) {
  return `$${price.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatTimeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function tickerName(symbol: MarketTicker) {
  if (symbol === "AAPL") {
    return "Apple Inc.";
  }
  if (symbol === "TSLA") {
    return "Tesla Inc.";
  }
  if (symbol === "BTC-USD") {
    return "Bitcoin / USD";
  }
  return symbol;
}

function toLiveTicker(point: MarketPricePoint, previousPrice?: number): MarketLiveTicker {
  const change = typeof previousPrice === "number" ? point.price - previousPrice : 0;
  const changePercent = previousPrice ? (change / previousPrice) * 100 : 0;

  return {
    symbol: point.ticker,
    name: tickerName(point.ticker),
    price: point.price,
    change,
    changePercent,
    lastUpdated: point.timestamp,
  };
}

export function MarketChartDemo() {
  const [tickers, setTickers] = useState<MarketLiveTicker[]>([]);
  const [selectedTicker, setSelectedTicker] = useState<MarketTicker>("AAPL");
  const [history, setHistory] = useState<DashboardPricePoint[]>([]);
  const [error, setError] = useState("");
  const selectedTickerRef = useRef<MarketTicker>(selectedTicker);
  const historyCacheRef = useRef<
    Record<string, { points: DashboardPricePoint[]; cachedAt: number }>
  >({});

  const persistHistoryCache = () => {
    try {
      localStorage.setItem(HISTORY_CACHE_STORAGE_KEY, JSON.stringify(historyCacheRef.current));
    } catch {
      // Ignore storage failures; in-memory cache still works.
    }
  };

  const selectedData = useMemo(
    () => tickers.find((ticker) => ticker.symbol === selectedTicker),
    [selectedTicker, tickers]
  );

  useEffect(() => {
    selectedTickerRef.current = selectedTicker;
  }, [selectedTicker]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_CACHE_STORAGE_KEY);
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw) as Record<string, { points: DashboardPricePoint[]; cachedAt: number }>;
      if (parsed && typeof parsed === "object") {
        historyCacheRef.current = parsed;
      }
    } catch {
      // Ignore malformed cached values.
    }
  }, []);

  useEffect(() => {
    const loadTickers = async () => {
      try {
        const response = await fetch(`${MARKET_API_URL}/tickers`, { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Failed to load tickers");
        }

        const payload = (await response.json()) as MarketTickersResponse;
        const normalized = payload.tickers.map((symbol) => ({
          symbol,
          name: tickerName(symbol),
          price: 0,
          change: 0,
          changePercent: 0,
          lastUpdated: new Date().toISOString(),
        }));

        setTickers(normalized);
        if (payload.tickers.length) {
          setSelectedTicker(payload.tickers[0]);
        }
      } catch {
        setError("Failed to load market data");
      }
    };

    void loadTickers();
  }, []);

  useEffect(() => {
    const loadHistory = async () => {
      if (!selectedTicker) {
        return;
      }

      const cached = historyCacheRef.current[selectedTicker];
      if (cached && Date.now() - cached.cachedAt < HISTORY_CACHE_TTL_MS) {
        setHistory(cached.points);
        return;
      }

      try {
        const response = await fetch(`${MARKET_API_URL}/prices/history?ticker=${selectedTicker}&limit=80`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to load history");
        }

        const payload = (await response.json()) as MarketHistoryResponse;
        const mapped = payload.prices.map((point) => ({ timestamp: point.timestamp, price: point.price }));
        historyCacheRef.current[selectedTicker] = {
          points: mapped,
          cachedAt: Date.now(),
        };
        persistHistoryCache();
        setHistory(mapped);
      } catch {
        setError("Failed to load history");
      }
    };

    void loadHistory();
  }, [selectedTicker]);

  useEffect(() => {
    let active = true;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let ws: WebSocket | null = null;

    const connect = () => {
      ws = new WebSocket(MARKET_WS_URL);

      ws.onopen = () => {
        setError("");
      };

      ws.onmessage = (event) => {
        let message: MarketWsMessage;
        try {
          message = JSON.parse(event.data) as MarketWsMessage;
        } catch {
          return;
        }

        if (message.type === "price.snapshot" && Array.isArray(message.payload)) {
          const snapshot = message.payload as MarketPricePoint[];

          setTickers((previous) => {
            const next = [...previous];

            snapshot.forEach((point) => {
              const index = next.findIndex((ticker) => ticker.symbol === point.ticker);
              if (index >= 0) {
                next[index] = toLiveTicker(point, next[index].price || undefined);
              }
            });

            return next;
          });

          return;
        }

        if (message.type !== "price.update" || typeof message.payload !== "object" || !message.payload) {
          return;
        }

        const incoming = message.payload as MarketPricePoint;

        setTickers((previous) => {
          const index = previous.findIndex((ticker) => ticker.symbol === incoming.ticker);
          if (index < 0) {
            return [toLiveTicker(incoming), ...previous];
          }

          const next = [...previous];
          next[index] = toLiveTicker(incoming, previous[index].price);
          return next;
        });

      if (incoming.ticker === selectedTickerRef.current) {
        setHistory((previous) => {
          const next = [...previous, { timestamp: incoming.timestamp, price: incoming.price }];
          const trimmed = next.slice(-120);
          historyCacheRef.current[incoming.ticker] = {
            points: trimmed,
            cachedAt: Date.now(),
          };
          persistHistoryCache();
          return trimmed;
        });
      }
    };

      ws.onerror = () => {
        setError(`WebSocket connection error (${MARKET_WS_URL})`);
      };

      ws.onclose = () => {
        if (!active) {
          return;
        }

        reconnectTimer = setTimeout(() => {
          connect();
        }, 2000);
      };
    };

    connect();

    return () => {
      active = false;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      ws?.close();
    };
  }, []);

  return (
    <section className="mt-8">
      <div className="flex w-full flex-col gap-4 rounded-2xl border border-slate-200 bg-white/85 p-4 shadow md:flex-row">
        <section className="w-full md:w-80">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Live Tickers</h2>
          </div>

          <div className="space-y-2">
            {tickers.map((ticker) => {
              const active = ticker.symbol === selectedTicker;
              const isUp = ticker.change >= 0;

              return (
                <button
                  key={ticker.symbol}
                  onClick={() => setSelectedTicker(ticker.symbol)}
                  className={`w-full rounded-lg border px-3 py-2 text-left transition ${
                    active
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "text-gray-600 border-slate-200 bg-white hover:border-slate-400"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text">{ticker.symbol}</span>
                    <span>{formatMoney(ticker.price)}</span>
                  </div>
                  <p
                    className={`text-xs ${
                      active ? "text-slate-600" : isUp ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {isUp ? "+" : ""}
                    {ticker.changePercent.toFixed(2)}%
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        <section className="flex-1 rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">{selectedTicker}</h1>
              <p className="text-sm text-slate-800">{selectedData?.name || "Loading..."}</p>
            </div>
            {selectedData ? (
              <div className="text-right">
                <p className="text-2xl font-semibold text-slate-900">{formatMoney(selectedData.price)}</p>
                <p
                  className={`text-sm ${selectedData.change >= 0 ? "text-emerald-600" : "text-rose-600"}`}
                >
                  {selectedData.change >= 0 ? "+" : ""}
                  {selectedData.change.toFixed(2)} ({selectedData.changePercent.toFixed(2)}%)
                </p>
              </div>
            ) : null}
          </div>

          {error ? <p className="mb-3 text-sm text-rose-600">{error}</p> : null}

          <div className="h-80 w-full md:h-105">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="2 2" stroke="#d6d3d1" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={formatTimeLabel}
                  minTickGap={24}
                  stroke="#57534e"
                />
                <YAxis domain={["auto", "auto"]} stroke="#57534e" />
                <Tooltip
                  formatter={(value: number | string | undefined) => {
                    const parsed = Number(value ?? 0);
                    return [`$${parsed.toFixed(2)}`, "Price"];
                  }}
                  labelFormatter={(value) => new Date(value).toLocaleString()}
                />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="#0f766e"
                  strokeWidth={3}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-6 rounded-lg border border-slate-200">
            <div className="border-b border-slate-200 px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-900">
                {selectedTicker} History
              </h3>
            </div>

            <div className="max-h-100 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-100 text-slate-700">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">Timestamp</th>
                    <th className="px-4 py-2 text-right font-medium">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {[...history].reverse().map((point, index) => (
                    <tr key={`${point.timestamp}-${index}`} className="border-t border-slate-100">
                      <td className="px-4 py-2 text-slate-700">
                        {new Date(point.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-right font-medium text-slate-900">
                        {formatMoney(point.price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}
