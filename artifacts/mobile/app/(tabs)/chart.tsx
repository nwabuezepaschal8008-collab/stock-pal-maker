import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useKlines } from "../../hooks/useKlines";
import { PriceChart } from "../../components/PriceChart";
import { TradingViewChart } from "../../components/TradingViewChart";
import { TRADING_PAIRS, INTERVALS } from "../../constants/symbols";

type ChartMode = "native" | "tradingview";

export default function ChartScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [interval, setChartInterval] = useState("1h");
  const [chartMode, setChartMode] = useState<ChartMode>("tradingview");

  const { data: klines, isLoading, error, refetch } = useKlines(symbol, interval);

  const last = klines?.[klines.length - 1];
  const first = klines?.[0];
  const priceChange =
    last && first && first.open > 0
      ? ((last.close - first.open) / first.open) * 100
      : 0;
  const isUp = priceChange >= 0;
  const priceFormatted = last
    ? last.close >= 1000
      ? last.close.toLocaleString("en-US", { maximumFractionDigits: 2 })
      : last.close < 1
      ? last.close.toFixed(5)
      : last.close.toFixed(2)
    : "—";

  const chartWidth = width - 32;
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const currentPair = TRADING_PAIRS.find((p) => p.symbol === symbol);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 90 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Chart</Text>
        <View style={[styles.modeSwitch, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          {(["tradingview", "native"] as ChartMode[]).map((m) => (
            <TouchableOpacity
              key={m}
              onPress={() => setChartMode(m)}
              style={[
                styles.modeBtn,
                chartMode === m && { backgroundColor: colors.primary },
              ]}
            >
              <Feather
                name={m === "tradingview" ? "tv" : "bar-chart-2"}
                size={14}
                color={chartMode === m ? colors.primaryForeground : colors.mutedForeground}
              />
              <Text
                style={[
                  styles.modeBtnText,
                  { color: chartMode === m ? colors.primaryForeground : colors.mutedForeground },
                ]}
              >
                {m === "tradingview" ? "TradingView" : "Simple"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.symbolRow}
      >
        {TRADING_PAIRS.map((p) => (
          <TouchableOpacity
            key={p.symbol}
            onPress={() => setSymbol(p.symbol)}
            style={[
              styles.symbolPill,
              {
                backgroundColor: symbol === p.symbol ? colors.primary : colors.secondary,
                borderColor: symbol === p.symbol ? colors.primary : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.symbolPillText,
                {
                  color:
                    symbol === p.symbol
                      ? colors.primaryForeground
                      : colors.mutedForeground,
                },
              ]}
            >
              {p.base}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.priceBlock}>
        <Text style={[styles.pairName, { color: colors.mutedForeground }]}>
          {currentPair?.name ?? symbol} / USDT
        </Text>
        <Text style={[styles.currentPrice, { color: colors.foreground }]}>
          ${priceFormatted}
        </Text>
        <View
          style={[
            styles.changePill,
            {
              backgroundColor: isUp
                ? `${colors.bullish}20`
                : `${colors.bearish}20`,
            },
          ]}
        >
          <Text
            style={[
              styles.priceChange,
              { color: isUp ? colors.bullish : colors.bearish },
            ]}
          >
            {isUp ? "▲" : "▼"} {Math.abs(priceChange).toFixed(2)}%
          </Text>
        </View>
      </View>

      <View style={styles.intervalRow}>
        {INTERVALS.map((iv) => (
          <TouchableOpacity
            key={iv.value}
            onPress={() => setChartInterval(iv.value)}
            style={[
              styles.intervalBtn,
              {
                backgroundColor:
                  interval === iv.value ? colors.primary : "transparent",
              },
            ]}
          >
            <Text
              style={[
                styles.intervalText,
                {
                  color:
                    interval === iv.value
                      ? colors.primaryForeground
                      : colors.mutedForeground,
                },
              ]}
            >
              {iv.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {chartMode === "tradingview" ? (
        <TradingViewChart symbol={symbol} interval={interval} height={440} />
      ) : (
        <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
          {isLoading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : error ? (
            <View style={styles.loadingBox}>
              <Text style={{ color: colors.bearish }}>Failed to load</Text>
              <TouchableOpacity onPress={() => refetch()} style={styles.retryBtn}>
                <Text style={{ color: colors.primary }}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <PriceChart klines={klines ?? []} width={chartWidth - 32} height={200} />
          )}
        </View>
      )}

      {last && (
        <View style={styles.statsGrid}>
          {[
            {
              label: "Open",
              value:
                last.open >= 1000
                  ? `$${last.open.toLocaleString("en-US", { maximumFractionDigits: 2 })}`
                  : `$${last.open.toFixed(4)}`,
            },
            {
              label: "High",
              value:
                last.high >= 1000
                  ? `$${last.high.toLocaleString("en-US", { maximumFractionDigits: 2 })}`
                  : `$${last.high.toFixed(4)}`,
            },
            {
              label: "Low",
              value:
                last.low >= 1000
                  ? `$${last.low.toLocaleString("en-US", { maximumFractionDigits: 2 })}`
                  : `$${last.low.toFixed(4)}`,
            },
            {
              label: "Volume",
              value:
                last.volume >= 1_000_000
                  ? `${(last.volume / 1_000_000).toFixed(2)}M`
                  : last.volume >= 1000
                  ? `${(last.volume / 1000).toFixed(2)}K`
                  : last.volume.toFixed(2),
            },
          ].map(({ label, value }) => (
            <View
              key={label}
              style={[styles.statBox, { backgroundColor: colors.card }]}
            >
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                {label}
              </Text>
              <Text style={[styles.statValue, { color: colors.foreground }]}>
                {value}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  modeSwitch: {
    flexDirection: "row",
    borderRadius: 10,
    borderWidth: 1,
    overflow: "hidden",
    padding: 3,
    gap: 3,
  },
  modeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 7,
  },
  modeBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  symbolRow: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  symbolPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  symbolPillText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  priceBlock: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  pairName: { fontSize: 13, fontFamily: "Inter_400Regular", marginRight: 4 },
  currentPrice: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  changePill: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  priceChange: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  intervalRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 4,
    marginBottom: 12,
  },
  intervalBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: "center",
  },
  intervalText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  chartCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  loadingBox: {
    height: 200,
    alignItems: "center",
    justifyContent: "center",
  },
  retryBtn: { marginTop: 8, padding: 8 },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 16,
  },
  statBox: { width: "47%", borderRadius: 12, padding: 14 },
  statLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  statValue: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
