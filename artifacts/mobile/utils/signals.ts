import { type Kline } from "../hooks/useKlines";

export type Signal = "BUY" | "SELL" | "HOLD";

export type SignalAnalysis = {
  signal: Signal;
  strength: number;
  rsi: number;
  ma7: number;
  ma25: number;
  priceChange: number;
  volumeRatio: number;
  reasons: string[];
};

function calcSMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1] ?? 0;
  const slice = prices.slice(prices.length - period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

function calcRSI(prices: number[], period = 14): number {
  if (prices.length < period + 1) return 50;
  const changes = prices.slice(1).map((p, i) => p - prices[i]);
  const recent = changes.slice(-period);
  const gains = recent.filter((c) => c > 0).reduce((a, b) => a + b, 0) / period;
  const losses = Math.abs(recent.filter((c) => c < 0).reduce((a, b) => a + b, 0)) / period;
  if (losses === 0) return 100;
  const rs = gains / losses;
  return 100 - 100 / (1 + rs);
}

export function analyzeSignal(klines: Kline[]): SignalAnalysis {
  const closes = klines.map((k) => k.close);
  const volumes = klines.map((k) => k.volume);

  const ma7 = calcSMA(closes, 7);
  const ma25 = calcSMA(closes, 25);
  const rsi = calcRSI(closes);

  const last = closes[closes.length - 1] ?? 0;
  const first = closes[0] ?? 0;
  const priceChange = first > 0 ? ((last - first) / first) * 100 : 0;

  const avgVolume = volumes.slice(0, -5).reduce((a, b) => a + b, 0) / Math.max(volumes.length - 5, 1);
  const recentVolume = volumes.slice(-5).reduce((a, b) => a + b, 0) / 5;
  const volumeRatio = avgVolume > 0 ? recentVolume / avgVolume : 1;

  const reasons: string[] = [];
  let bullScore = 0;
  let bearScore = 0;

  if (ma7 > ma25) {
    bullScore += 2;
    reasons.push("MA7 above MA25 (bullish crossover)");
  } else {
    bearScore += 2;
    reasons.push("MA7 below MA25 (bearish crossover)");
  }

  if (rsi < 30) {
    bullScore += 3;
    reasons.push(`RSI ${rsi.toFixed(0)} — oversold`);
  } else if (rsi > 70) {
    bearScore += 3;
    reasons.push(`RSI ${rsi.toFixed(0)} — overbought`);
  } else if (rsi > 50) {
    bullScore += 1;
  } else {
    bearScore += 1;
  }

  if (volumeRatio > 1.5) {
    reasons.push(`High volume (${volumeRatio.toFixed(1)}x avg)`);
    if (priceChange > 0) bullScore += 1;
    else bearScore += 1;
  }

  if (priceChange > 2) {
    bullScore += 1;
    reasons.push(`Strong momentum +${priceChange.toFixed(2)}%`);
  } else if (priceChange < -2) {
    bearScore += 1;
    reasons.push(`Downtrend ${priceChange.toFixed(2)}%`);
  }

  const totalScore = bullScore + bearScore;
  let signal: Signal = "HOLD";
  let strength = 0;

  if (bullScore > bearScore && totalScore > 0) {
    signal = "BUY";
    strength = Math.min(Math.round((bullScore / totalScore) * 100), 100);
  } else if (bearScore > bullScore && totalScore > 0) {
    signal = "SELL";
    strength = Math.min(Math.round((bearScore / totalScore) * 100), 100);
  } else {
    signal = "HOLD";
    strength = 50;
  }

  return { signal, strength, rsi, ma7, ma25, priceChange, volumeRatio, reasons };
}
