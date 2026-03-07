"use client";

import { create } from "zustand";

import { decryptObject, encryptObject } from "@/lib/security/storage-crypto";

const HISTORY_CACHE_STORAGE_KEY = "market_history_cache_v1";

function saveCache(cache: MarketHistoryCacheMap) {
  try {
    const encrypted = encryptObject(cache);
    localStorage.setItem(HISTORY_CACHE_STORAGE_KEY, encrypted);
  } catch {
    // Ignore storage failures; runtime cache will still work.
  }
}

function loadCache(): MarketHistoryCacheMap {
  try {
    const raw = localStorage.getItem(HISTORY_CACHE_STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const decrypted = decryptObject<unknown>(raw);
    if (!decrypted || typeof decrypted !== "object") {
      return {};
    }

    return decrypted as MarketHistoryCacheMap;
  } catch {
    return {};
  }
}

export const useMarketHistoryCacheStore = create<MarketHistoryCacheState>((set, get) => ({
  cache: {},
  hydrateCache: () => {
    const loaded = loadCache();
    set({ cache: loaded });
  },
  getTickerHistory: (ticker, ttlMs) => {
    const entry = get().cache[ticker];
    if (!entry) {
      return null;
    }

    if (Date.now() - entry.cachedAt >= ttlMs) {
      return null;
    }

    return entry.points;
  },
  setTickerHistory: (ticker, points) => {
    set((state) => {
      const next = {
        ...state.cache,
        [ticker]: {
          points,
          cachedAt: Date.now(),
        },
      };
      saveCache(next);
      return { cache: next };
    });
  },
  appendTickerPoint: (ticker, point, maxPoints) => {
    set((state) => {
      const previous = state.cache[ticker]?.points || [];
      const nextPoints = [...previous, point].slice(-maxPoints);
      const next = {
        ...state.cache,
        [ticker]: {
          points: nextPoints,
          cachedAt: Date.now(),
        },
      };
      saveCache(next);
      return { cache: next };
    });
  },
}));
