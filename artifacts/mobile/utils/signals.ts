import { type Kline } from "../hooks/useKlines";

export type Signal = "BUY" | "SELL" | "HOLD";

export type MacdResult = {
  macdLine: number;
  signalLine: number;
  histogram: number;
};

export type IndicatorScores = {
  rsi: { value: number; score: number; label: string };
  ema: { ema9: number; ema21: number; score: number; label: string };
  macd: MacdResult & { score: number; label: string };
};

export type SignalAnalysis = {
  signal: Signal;
  confidence: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  riskRewardRatio: number;
  atr: number;
  indicators: IndicatorScores;
  reasons: string[];
  updatedAt: number;
};

function calcEMA(prices: number[], period: number): number[] {
  if (prices.length === 0) return [];
  const k = 2 / (period + 1);
  const emas: number[] = [prices[0]!];
  for (let i = 1; i < prices.length; i++) {
    emas.push(prices[i]! * k + emas[i - 1]! * (1 - k));
  }
  return emas;
}

function calcRSI(prices: number[], period = 14): number {
  if (prices.length < period + 1) return 50;
  const changes = prices.slice(1).map((p, i) => p - prices[i]!);

  let avgGain =
    changes.slice(0, period).filter((c) => c > 0).reduce((a, b) => a + b, 0) / period;
  let avgLoss =
    Math.abs(changes.slice(0, period).filter((c) => c < 0).reduce((a, b) => a + b, 0)) / period;

  for (let i = period; i < changes.length; i++) {
    const gain = Math.max(0, changes[i]!);
    const loss = Math.abs(Math.min(0, changes[i]!));
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

function calcMACD(prices: number[]): MacdResult {
  const ema12 = calcEMA(prices, 12);
  const ema26 = calcEMA(prices, 26);

  const macdSeries = ema12.map((v, i) => v - ema26[i]!);
  const signalSeries = calcEMA(macdSeries.slice(macdSeries.length - 50), 9);

  const macdLine = macdSeries[macdSeries.length - 1] ?? 0;
  const signalLine = signalSeries[signalSeries.length - 1] ?? 0;

  return {
    macdLine,
    signalLine,
    histogram: macdLine - signalLine,
  };
}

function calcATR(klines: Kline[], period = 14): number {
  if (klines.length < 2) return 0;
  const trs: number[] = [];
  for (let i = 1; i < klines.length; i++) {
    const cur = klines[i]!;
    const prev = klines[i - 1]!;
    trs.push(
      Math.max(
        cur.high - cur.low,
        Math.abs(cur.high - prev.close),
        Math.abs(cur.low - prev.close),
      ),
    );
  }
  const slice = trs.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / slice.length;
}

function rsiScore(rsi: number): { score: number; label: string } {
  if (rsi <= 20) return { score: 95, label: `RSI ${rsi.toFixed(1)} — extremely oversold` };
  if (rsi <= 30) return { score: 80, label: `RSI ${rsi.toFixed(1)} — oversold` };
  if (rsi <= 45) return { score: 60, label: `RSI ${rsi.toFixed(1)} — leaning bullish` };
  if (rsi <= 55) return { score: 50, label: `RSI ${rsi.toFixed(1)} — neutral` };
  if (rsi <= 70) return { score: 40, label: `RSI ${rsi.toFixed(1)} — leaning bearish` };
  if (rsi <= 80) return { score: 20, label: `RSI ${rsi.toFixed(1)} — overbought` };
  return { score: 5, label: `RSI ${rsi.toFixed(1)} — extremely overbought` };
}

function emaScore(ema9: number, ema21: number, price: number): { score: number; label: string } {
  const spread = ((ema9 - ema21) / ema21) * 100;
  const priceAbove9 = price > ema9;
  const priceAbove21 = price > ema21;

  if (ema9 > ema21 && priceAbove9 && priceAbove21) {
    const bonus = Math.round(Math.min(spread * 5, 20));
    return { score: 75 + bonus, label: `EMA9 > EMA21 — bullish crossover (+${spread.toFixed(2)}%)` };
  }
  if (ema9 < ema21 && !priceAbove9 && !priceAbove21) {
    const penalty = Math.round(Math.min(Math.abs(spread) * 5, 20));
    return { score: 25 - penalty, label: `EMA9 < EMA21 — bearish crossover (${spread.toFixed(2)}%)` };
  }
  if (ema9 > ema21 && !priceAbove9) {
    return { score: 55, label: `EMA bullish but price below EMA9` };
  }
  return { score: 45, label: `EMA divergence — price between EMAs` };
}

function macdScore(macd: MacdResult): { score: number; label: string } {
  const { macdLine, signalLine, histogram } = macd;
  const bullishCross = macdLine > signalLine;
  const positiveHistogram = histogram > 0;

  if (bullishCross && positiveHistogram && macdLine > 0) {
    return { score: 85, label: `MACD bullish · histogram +${Math.abs(histogram).toFixed(4)}` };
  }
  if (bullishCross && positiveHistogram) {
    return { score: 72, label: `MACD bullish crossover · below zero line` };
  }
  if (!bullishCross && !positiveHistogram && macdLine < 0) {
    return { score: 15, label: `MACD bearish · histogram −${Math.abs(histogram).toFixed(4)}` };
  }
  if (!bullishCross && !positiveHistogram) {
    return { score: 28, label: `MACD bearish crossover · above zero line` };
  }
  return { score: 50, label: `MACD neutral — lines converging` };
}

function fmtPrice(p: number): string {
  if (p >= 1000) return p.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (p >= 1) return p.toFixed(4);
  return p.toFixed(6);
}

export function analyzeSignal(klines: Kline[]): SignalAnalysis {
  const closes = klines.map((k) => k.close);
  const entryPrice = closes[closes.length - 1] ?? 0;

  const rsi = calcRSI(closes);
  const ema9arr = calcEMA(closes, 9);
  const ema21arr = calcEMA(closes, 21);
  const ema9 = ema9arr[ema9arr.length - 1] ?? entryPrice;
  const ema21 = ema21arr[ema21arr.length - 1] ?? entryPrice;
  const macd = calcMACD(closes);
  const atr = calcATR(klines);

  const rsiResult = rsiScore(rsi);
  const emaResult = emaScore(ema9, ema21, entryPrice);
  const macdResult = macdScore(macd);

  const RSI_WEIGHT = 0.30;
  const EMA_WEIGHT = 0.35;
  const MACD_WEIGHT = 0.35;

  const compositeScore =
    rsiResult.score * RSI_WEIGHT +
    emaResult.score * EMA_WEIGHT +
    (macdResult.score + 0) * MACD_WEIGHT;

  let signal: Signal;
  let confidence: number;

  if (compositeScore >= 62) {
    signal = "BUY";
    confidence = Math.min(Math.round(((compositeScore - 50) / 50) * 100 + 50), 99);
  } else if (compositeScore <= 38) {
    signal = "SELL";
    confidence = Math.min(Math.round(((50 - compositeScore) / 50) * 100 + 50), 99);
  } else {
    signal = "HOLD";
    confidence = Math.round(50 + Math.abs(compositeScore - 50));
  }

  const slMultiplier = 1.5;
  const tpMultiplier = 2.5;

  let stopLoss: number;
  let takeProfit: number;

  const recentLow = Math.min(...klines.slice(-10).map((k) => k.low));
  const recentHigh = Math.max(...klines.slice(-10).map((k) => k.high));

  if (signal === "BUY") {
    stopLoss = Math.min(entryPrice - atr * slMultiplier, recentLow * 0.999);
    takeProfit = entryPrice + atr * tpMultiplier;
  } else if (signal === "SELL") {
    stopLoss = Math.max(entryPrice + atr * slMultiplier, recentHigh * 1.001);
    takeProfit = entryPrice - atr * tpMultiplier;
  } else {
    stopLoss = entryPrice - atr * slMultiplier;
    takeProfit = entryPrice + atr * tpMultiplier;
  }

  const risk = Math.abs(entryPrice - stopLoss);
  const reward = Math.abs(takeProfit - entryPrice);
  const riskRewardRatio = risk > 0 ? reward / risk : 0;

  const reasons = [rsiResult.label, emaResult.label, macdResult.label];

  return {
    signal,
    confidence,
    entryPrice,
    stopLoss,
    takeProfit,
    riskRewardRatio,
    atr,
    indicators: {
      rsi: { value: rsi, score: rsiResult.score, label: rsiResult.label },
      ema: { ema9, ema21, score: emaResult.score, label: emaResult.label },
      macd: { ...macd, score: macdResult.score, label: macdResult.label },
    },
    reasons,
    updatedAt: Date.now(),
  };
}
