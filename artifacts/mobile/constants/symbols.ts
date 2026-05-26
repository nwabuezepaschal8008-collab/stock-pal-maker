export type TradingPair = {
  symbol: string;
  base: string;
  quote: string;
  name: string;
};

export const TRADING_PAIRS: TradingPair[] = [
  { symbol: "BTCUSDT", base: "BTC", quote: "USDT", name: "Bitcoin" },
  { symbol: "ETHUSDT", base: "ETH", quote: "USDT", name: "Ethereum" },
  { symbol: "BNBUSDT", base: "BNB", quote: "USDT", name: "BNB" },
  { symbol: "SOLUSDT", base: "SOL", quote: "USDT", name: "Solana" },
  { symbol: "XRPUSDT", base: "XRP", quote: "USDT", name: "XRP" },
  { symbol: "ADAUSDT", base: "ADA", quote: "USDT", name: "Cardano" },
  { symbol: "DOGEUSDT", base: "DOGE", quote: "USDT", name: "Dogecoin" },
  { symbol: "AVAXUSDT", base: "AVAX", quote: "USDT", name: "Avalanche" },
];

export const INTERVALS = [
  { label: "1m", value: "1m" },
  { label: "5m", value: "5m" },
  { label: "15m", value: "15m" },
  { label: "1h", value: "1h" },
  { label: "4h", value: "4h" },
  { label: "1d", value: "1d" },
];
