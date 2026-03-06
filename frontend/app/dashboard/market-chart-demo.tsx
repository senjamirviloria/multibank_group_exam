"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const chartData: DashboardPricePoint[] = [
  { time: "09:30", price: 189.82 },
  { time: "10:00", price: 190.15 },
  { time: "10:30", price: 189.74 },
  { time: "11:00", price: 190.63 },
  { time: "11:30", price: 191.1 },
  { time: "12:00", price: 190.87 },
  { time: "12:30", price: 191.42 },
  { time: "13:00", price: 191.06 },
];

export function MarketChartDemo() {
  return (
    <section className="mt-8 rounded-lg border border-slate-300 bg-slate-200 p-4">
      <h2 className="text-lg font-semibold text-slate-900">Recharts Demo</h2>
      <p className="mt-1 text-sm text-slate-600">Sample intraday price chart for AAPL.</p>

      <div className="mt-4 h-72 w-full rounded bg-white p-3">
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
              dot={{ r: 2, fill: "#0f172a" }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
