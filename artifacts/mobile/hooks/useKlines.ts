import { useQuery } from "@tanstack/react-query";

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

export function useKlines(symbol: string, interval: string) {
  return useQuery({
    queryKey: ["klines", symbol, interval],
    queryFn: async () => {
      const domain = process.env.EXPO_PUBLIC_DOMAIN;
      const base = domain ? `https://${domain}` : "";
      const url = `${base}/api/klines?symbol=${symbol}&interval=${interval}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch klines");
      const raw: unknown[][] = await res.json();
      return parseKlines(raw);
    },
    refetchInterval: 10_000,
    staleTime: 5_000,
  });
}
