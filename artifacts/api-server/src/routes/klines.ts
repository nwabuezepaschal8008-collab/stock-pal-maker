import { Router, type IRouter } from "express";
import axios from "axios";

const router: IRouter = Router();

const BINANCE_BASE_URL = "https://data-api.binance.vision/api/v3/klines";

const TTL: Record<string, number> = {
  "1m": 15_000,
  "5m": 30_000,
  "15m": 60_000,
  "1h": 120_000,
  "4h": 300_000,
  "1d": 600_000,
};

type CacheEntry = { data: unknown; fetchedAt: number };
const cache = new Map<string, CacheEntry>();

function getCached(key: string, ttl: number): unknown | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.fetchedAt > ttl) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

type Waiter = {
  key: string;
  symbol: string;
  interval: string;
  limit: number;
  ttl: number;
  resolve: (v: unknown) => void;
  reject: (e: Error) => void;
};

const waiters = new Map<string, Waiter[]>();
let queueBusy = false;
const pendingQueue: Waiter[] = [];

function enqueue(waiter: Waiter) {
  const cached = getCached(waiter.key, waiter.ttl);
  if (cached) {
    waiter.resolve(cached);
    return;
  }

  const existing = waiters.get(waiter.key);
  if (existing) {
    existing.push(waiter);
    return;
  }

  waiters.set(waiter.key, [waiter]);
  pendingQueue.push(waiter);
  drainQueue();
}

async function drainQueue() {
  if (queueBusy) return;
  queueBusy = true;

  while (pendingQueue.length > 0) {
    const leader = pendingQueue.shift()!;
    const group = waiters.get(leader.key) ?? [leader];
    waiters.delete(leader.key);

    const cached = getCached(leader.key, leader.ttl);
    if (cached) {
      group.forEach((w) => w.resolve(cached));
    } else {
      try {
        const { data } = await axios.get(BINANCE_BASE_URL, {
          params: {
            symbol: leader.symbol,
            interval: leader.interval,
            limit: leader.limit,
          },
          timeout: 8_000,
        });
        cache.set(leader.key, { data, fetchedAt: Date.now() });
        group.forEach((w) => w.resolve(data));
      } catch (err) {
        const e =
          axios.isAxiosError(err)
            ? Object.assign(
                new Error(
                  err.response?.data?.msg ?? err.message ?? "Binance error",
                ),
                { statusCode: err.response?.status ?? 502 },
              )
            : new Error("Internal fetch error");
        group.forEach((w) => w.reject(e));
      }
    }

    if (pendingQueue.length > 0) {
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  queueBusy = false;
}

function fetchKlines(
  symbol: string,
  interval: string,
  limit: number,
): Promise<unknown> {
  const key = `${symbol}:${interval}:${limit}`;
  const ttl = TTL[interval] ?? 60_000;

  const cached = getCached(key, ttl);
  if (cached) return Promise.resolve(cached);

  return new Promise<unknown>((resolve, reject) => {
    enqueue({ key, symbol, interval, limit, ttl, resolve, reject });
  });
}

router.get("/klines", async (req, res) => {
  const symbol = (req.query["symbol"] as string | undefined) || "BTCUSDT";
  const interval = (req.query["interval"] as string | undefined) || "1m";
  const limit = Math.min(
    parseInt((req.query["limit"] as string | undefined) || "500", 10) || 500,
    1000,
  );

  try {
    const data = await fetchKlines(symbol, interval, limit);
    res.json(data);
  } catch (err: unknown) {
    const status = (err as { statusCode?: number }).statusCode ?? 500;
    const message =
      err instanceof Error ? err.message : "Failed to fetch klines";
    req.log.warn({ symbol, interval, status, message }, "klines fetch error");
    res.status(status).json({ error: message });
  }
});

export default router;
