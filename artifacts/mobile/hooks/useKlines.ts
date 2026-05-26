import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export type Kline = {
  openTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  closeTime: number;
};

function parseKlines(raw: unknown[][]): Kline[] {
  return raw.map((k) => ({
    openTime: k[0] as number,
    open: parseFloat(k[1] as string),
    high: parseFloat(k[2] as string),
    low: parseFloat(k[3] as string),
    close: parseFloat(k[4] as string),
    volume: parseFloat(k[5] as string),
    closeTime: k[6] as number,
  }));
}

function refetchMs(interval: string): number {
  if (interval === "1m") return 15_000;
  if (interval === "5m") return 30_000;
  if (interval === "15m") return 60_000;
  if (interval === "1h") return 120_000;
  if (interval === "4h") return 300_000;
  return 600_000;
}

export function useKlines(
  symbol: string,
  interval: string,
  index = 0,
) {
  const staggerMs = index * 250;
  const [enabled, setEnabled] = useState(staggerMs === 0);

  useEffect(() => {
    if (staggerMs === 0) return;
    const t = setTimeout(() => setEnabled(true), staggerMs);
    return () => clearTimeout(t);
  }, [staggerMs]);

  return useQuery({
    queryKey: ["klines", symbol, interval],
    enabled,
    queryFn: async () => {
      const domain = process.env.EXPO_PUBLIC_DOMAIN;
      const base = domain ? `https://${domain}` : "";
      const url = `${base}/api/klines?symbol=${symbol}&interval=${interval}&limit=200`;
      const res = await fetch(url);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
      }
      const raw: unknown[][] = await res.json();
      return parseKlines(raw);
    },
    refetchInterval: refetchMs(interval),
    staleTime: refetchMs(interval) * 0.8,
    retry: 2,
    retryDelay: (attempt) => attempt * 1500,
  });
}
