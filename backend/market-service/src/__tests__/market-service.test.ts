import assert from "node:assert/strict";
import test from "node:test";
import jwt from "jsonwebtoken";

import { historyLimit, jwtSecret, tickers } from "../config";
import { generateUpdate, isTicker, parseTickerList } from "../helpers";
import { routeHttpRequest } from "../rest-handlers";
import { history } from "../state";

function createMockResponse(): {
  res: HttpResponse;
  getStatusCode: () => number;
  getJsonBody: () => unknown;
} {
  let statusCode = 0;
  let body = "";

  const res = {
    writeHead(code: number) {
      statusCode = code;
      return this;
    },
    end(chunk?: string) {
      body = chunk || "";
      return this;
    },
  } as unknown as HttpResponse;

  return {
    res,
    getStatusCode: () => statusCode,
    getJsonBody: () => JSON.parse(body || "{}"),
  };
}

function createAuthHeader(): string {
  const token = jwt.sign(
    {
      sub: "user-1",
      email: "demo@multibank.local",
      name: "Demo User",
    },
    jwtSecret,
    { expiresIn: "1h" }
  );

  return `Bearer ${token}`;
}

test("isTicker and parseTickerList normalize/validate ticker inputs", () => {
  assert.equal(isTicker("AAPL"), true);
  assert.equal(isTicker("INVALID"), false);
  assert.deepEqual(parseTickerList(null), tickers);
  assert.deepEqual(parseTickerList("aapl, tsla, nope"), ["AAPL", "TSLA"]);
  assert.deepEqual(parseTickerList("bad,input"), tickers);
});

test("generateUpdate appends a new point for ticker history", () => {
  history.set("AAPL", []);
  const point = generateUpdate("AAPL");

  assert.equal(point.ticker, "AAPL");
  assert.equal(typeof point.price, "number");
  assert.equal(typeof point.timestamp, "string");
  assert.equal(history.get("AAPL")?.length, 1);
});

test("routeHttpRequest returns fixed ticker list", () => {
  const req = {
    method: "GET",
    url: "/tickers",
    headers: { host: "localhost:4002", authorization: createAuthHeader() },
  } as HttpRequest;
  const { res, getStatusCode, getJsonBody } = createMockResponse();

  routeHttpRequest(req, res);

  assert.equal(getStatusCode(), 200);
  assert.deepEqual(getJsonBody(), { tickers });
});

test("routeHttpRequest rejects invalid ticker for history endpoint", () => {
  const req = {
    method: "GET",
    url: "/prices/history?ticker=INVALID&limit=5",
    headers: { host: "localhost:4002", authorization: createAuthHeader() },
  } as HttpRequest;
  const { res, getStatusCode, getJsonBody } = createMockResponse();

  routeHttpRequest(req, res);

  assert.equal(getStatusCode(), 400);
  assert.deepEqual(getJsonBody(), { error: "Valid ticker is required (AAPL, TSLA, BTC-USD)" });
});

test("routeHttpRequest enforces history limit and returns most recent points", () => {
  const series: PricePoint[] = [];
  for (let index = 1; index <= Math.min(historyLimit, 6); index += 1) {
    series.push({
      ticker: "AAPL",
      price: 100 + index,
      timestamp: new Date(1_700_000_000_000 + index * 1000).toISOString(),
    });
  }
  history.set("AAPL", series);

  const req = {
    method: "GET",
    url: "/prices/history?ticker=AAPL&limit=2",
    headers: { host: "localhost:4002", authorization: createAuthHeader() },
  } as HttpRequest;
  const { res, getStatusCode, getJsonBody } = createMockResponse();

  routeHttpRequest(req, res);

  assert.equal(getStatusCode(), 200);
  assert.deepEqual(getJsonBody(), {
    ticker: "AAPL",
    prices: series.slice(-2),
  });
});

test("routeHttpRequest returns 401 when market token is missing", () => {
  const req = {
    method: "GET",
    url: "/tickers",
    headers: { host: "localhost:4002" },
  } as HttpRequest;
  const { res, getStatusCode, getJsonBody } = createMockResponse();

  routeHttpRequest(req, res);

  assert.equal(getStatusCode(), 401);
  assert.deepEqual(getJsonBody(), { error: "Missing Bearer token" });
});
