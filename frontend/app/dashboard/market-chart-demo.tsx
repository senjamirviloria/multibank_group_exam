"use client";

import { useEffect, useMemo, useState } from "react";
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
const MARKET_WS_URL =
  process.env.NEXT_PUBLIC_MARKET_WS_URL || MARKET_API_URL.replace(/^http/, "ws") + "/ws";
const chartMaxPoints = 80;

function toChartPoint(point: MarketPricePoint): DashboardPricePoint {
  const date = new Date(point.timestamp);
  const time = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return {
    time,
    price: point.price,
  };
}

export function MarketChartDemo() {
  const [tickers, setTickers] = useState<MarketTicker[]>([]);
  const [selectedTicker, setSelectedTicker] = useState<MarketTicker | "">("");
  const [latestPrices, setLatestPrices] = useState<Record<string, number>>({});
  const [chartData, setChartData] = useState<DashboardPricePoint[]>([]);
  const [marketError, setMarketError] = useState("");

  const tickerQuery = useMemo(() => tickers.join(","), [tickers]);

  useEffect(() => {
    const loadTickers = async () => {
      try {
        const response = await fetch(`${MARKET_API_URL}/tickers`, { cache: "no-store" });
        const data = (await response.json()) as MarketTickersResponse;

        if (!response.ok || !Array.isArray(data.tickers)) {
          setMarketError("Unable to load tickers");
          return;
        }

        setTickers(data.tickers);
        setSelectedTicker((current) => current || data.tickers[0] || "");
      } catch {
        setMarketError("Unable to load tickers");
      }
    };

    void loadTickers();
  }, []);

  useEffect(() => {
    if (!selectedTicker) {
      return;
    }

    const loadHistory = async () => {
      try {
        const response = await fetch(
          `${MARKET_API_URL}/prices/history?ticker=${selectedTicker}&limit=50`,
          { cache: "no-store" }
        );
        const data = (await response.json()) as MarketHistoryResponse;

        if (!response.ok || !Array.isArray(data.prices)) {
          setMarketError("Unable to load price history");
          return;
        }

        setChartData(data.prices.map(toChartPoint));
      } catch {
        setMarketError("Unable to load price history");
      }
    };

    void loadHistory();
  }, [selectedTicker]);

  useEffect(() => {
    if (!tickerQuery) {
      return;
    }

    const ws = new WebSocket(`${MARKET_WS_URL}?tickers=${tickerQuery}`);

    ws.onmessage = (event) => {
      let message: MarketWsMessage;
      try {
        message = JSON.parse(event.data) as MarketWsMessage;
      } catch {
        return;
      }

      if (message.type === "price.snapshot" && Array.isArray(message.payload)) {
        const snapshot = message.payload as MarketPricePoint[];
        setLatestPrices((current) => {
          const next = { ...current };
          for (const point of snapshot) {
            next[point.ticker] = point.price;
          }
          return next;
        });
        return;
      }

      if (message.type !== "price.update" || typeof message.payload !== "object" || !message.payload) {
        return;
      }

      const point = message.payload as MarketPricePoint;

      setLatestPrices((current) => ({
        ...current,
        [point.ticker]: point.price,
      }));

      if (point.ticker === selectedTicker) {
        setChartData((current) => {
          const next = [...current, toChartPoint(point)];
          if (next.length > chartMaxPoints) {
            return next.slice(next.length - chartMaxPoints);
          }
          return next;
        });
      }
    };

    ws.onerror = () => {
      setMarketError("Market stream disconnected");
    };

    return () => {
      ws.close();
    };
  }, [selectedTicker, tickerQuery]);

  return (
    <section className="mt-8 rounded-lg border border-slate-300 bg-slate-100 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Live Market Dashboard</h2>
          <p className="mt-1 text-sm text-slate-600">
            Live prices from market-service ({tickers.length} tickers)
          </p>
        </div>
      </div>

      {marketError ? <p className="mt-3 text-sm text-red-600">{marketError}</p> : null}

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tickers.map((ticker) => {
          const isActive = selectedTicker === ticker;
          const latest = latestPrices[ticker];

          return (
            <button
              key={ticker}
              type="button"
              onClick={() => setSelectedTicker(ticker)}
              className={`rounded-lg border p-4 text-left transition ${
                isActive
                  ? "border-slate-800 bg-slate-800 text-white"
                  : "border-slate-300 bg-white text-slate-900 hover:border-slate-500"
              }`}
            >
              <p className="text-sm font-medium">{ticker}</p>
              <p className={`mt-2 text-xl font-semibold ${isActive ? "text-white" : "text-slate-900"}`}>
                {typeof latest === "number" ? latest.toFixed(2) : "--"}
              </p>
            </button>
          );
        })}
      </div>

      <div className="mt-6 rounded bg-white p-3 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-900">{selectedTicker || "Select a ticker"}</p>
          <p className="text-xs text-slate-500">Realtime</p>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="time" tick={{ fill: "#475569", fontSize: 12 }} />
              <YAxis
                domain={["dataMin - 0.5", "dataMax + 0.5"]}
                tick={{ fill: "#475569", fontSize: 12 }}
              />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#0f172a"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
