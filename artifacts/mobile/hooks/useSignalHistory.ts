import { useState, useEffect, useCallback } from "react";
import { storageGet, storageSet } from "../utils/storage";
import { type Signal } from "../utils/signals";

export type SignalRecord = {
  id: string;
  symbol: string;
  signal: Signal;
  confidence: number;
  entryPrice: number;
  timestamp: number;
  interval: string;
  outcome: "WIN" | "LOSS" | "PENDING";
  exitPrice?: number;
};

export type PairStats = {
  symbol: string;
  totalSignals: number;
  wins: number;
  losses: number;
  pending: number;
  winRate: number;
  avgConfidence: number;
  lastSignal: Signal | null;
};

const KEY = "signal_history_v2";

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function useSignalHistory() {
  const [records, setRecords] = useState<SignalRecord[]>([]);

  useEffect(() => {
    storageGet<SignalRecord[]>(KEY).then((saved) => {
      if (saved) setRecords(saved);
    });
  }, []);

  const recordSignal = useCallback(
    async (
      symbol: string,
      signal: Signal,
      confidence: number,
      price: number,
      interval: string,
    ) => {
      setRecords((prev) => {
        const lastForSymbol = prev.find(
          (r) => r.symbol === symbol && r.interval === interval,
        );

        let updated = [...prev];

        if (
          lastForSymbol &&
          lastForSymbol.outcome === "PENDING" &&
          lastForSymbol.signal !== signal &&
          lastForSymbol.signal !== "HOLD"
        ) {
          const isWin =
            (lastForSymbol.signal === "BUY" && price > lastForSymbol.entryPrice) ||
            (lastForSymbol.signal === "SELL" && price < lastForSymbol.entryPrice);

          updated = updated.map((r) =>
            r.id === lastForSymbol.id
              ? {
                  ...r,
                  outcome: isWin ? "WIN" : "LOSS",
                  exitPrice: price,
                }
              : r,
          );
        }

        if (signal === "HOLD") {
          storageSet(KEY, updated.slice(0, 200));
          return updated.slice(0, 200);
        }

        const newRecord: SignalRecord = {
          id: genId(),
          symbol,
          signal,
          confidence,
          entryPrice: price,
          timestamp: Date.now(),
          interval,
          outcome: "PENDING",
        };

        const next = [newRecord, ...updated].slice(0, 200);
        storageSet(KEY, next);
        return next;
      });
    },
    [],
  );

  const getStats = useCallback(
    (symbol?: string): PairStats[] => {
      const symbols = symbol
        ? [symbol]
        : Array.from(new Set(records.map((r) => r.symbol)));

      return symbols.map((sym) => {
        const recs = records.filter(
          (r) => r.symbol === sym && r.signal !== "HOLD",
        );
        const wins = recs.filter((r) => r.outcome === "WIN").length;
        const losses = recs.filter((r) => r.outcome === "LOSS").length;
        const pending = recs.filter((r) => r.outcome === "PENDING").length;
        const resolved = wins + losses;
        const winRate = resolved > 0 ? (wins / resolved) * 100 : 0;
        const avgConf =
          recs.length > 0
            ? recs.reduce((sum, r) => sum + r.confidence, 0) / recs.length
            : 0;
        const lastRec = recs[0];
        return {
          symbol: sym,
          totalSignals: recs.length,
          wins,
          losses,
          pending,
          winRate,
          avgConfidence: avgConf,
          lastSignal: lastRec?.signal ?? null,
        };
      });
    },
    [records],
  );

  const overallStats = useCallback(() => {
    const actionable = records.filter((r) => r.signal !== "HOLD");
    const wins = actionable.filter((r) => r.outcome === "WIN").length;
    const losses = actionable.filter((r) => r.outcome === "LOSS").length;
    const pending = actionable.filter((r) => r.outcome === "PENDING").length;
    const resolved = wins + losses;
    return {
      total: actionable.length,
      wins,
      losses,
      pending,
      winRate: resolved > 0 ? (wins / resolved) * 100 : 0,
    };
  }, [records]);

  const clearHistory = useCallback(async () => {
    setRecords([]);
    await storageSet(KEY, []);
  }, []);

  return { records, recordSignal, getStats, overallStats, clearHistory };
}
