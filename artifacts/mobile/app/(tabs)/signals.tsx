import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useKlines } from "../../hooks/useKlines";
import { analyzeSignal, type SignalAnalysis } from "../../utils/signals";
import { SignalCard } from "../../components/SignalCard";
import { useAlerts } from "../../hooks/useAlerts";
import { useSignalHistory } from "../../hooks/useSignalHistory";
import { TRADING_PAIRS, INTERVALS } from "../../constants/symbols";

const SIGNAL_INTERVALS = INTERVALS.filter((iv) =>
  ["1h", "4h", "1d"].includes(iv.value),
);

function SignalItem({
  symbol,
  interval,
  filter,
  index,
  checkAlerts,
  recordSignal,
}: {
  symbol: string;
  interval: string;
  filter: "ALL" | "BUY" | "SELL" | "HOLD";
  index: number;
  checkAlerts: (sym: string, price: number, prevPrice: number, signal?: string) => Promise<void>;
  recordSignal: (sym: string, signal: any, confidence: number, price: number, interval: string) => Promise<void>;
}) {
  const { data: klines, isLoading } = useKlines(symbol, interval, index);
  const colors = useColors();
  const prevPriceRef = useRef<number>(0);
  const prevSignalRef = useRef<string>("");

  const analysis = useMemo<SignalAnalysis | null>(() => {
    if (!klines || klines.length < 50) return null;
    return analyzeSignal(klines);
  }, [klines]);

  useEffect(() => {
    if (!analysis || !klines || klines.length === 0) return;
    const price = klines[klines.length - 1].close;
    const prevPrice = prevPriceRef.current || price;

    checkAlerts(symbol, price, prevPrice, analysis.signal);
    prevPriceRef.current = price;

    if (analysis.signal !== prevSignalRef.current) {
      recordSignal(symbol, analysis.signal, analysis.confidence, price, interval);
      prevSignalRef.current = analysis.signal;
    }
  }, [analysis?.signal, klines]);

  if (isLoading) {
    return (
      <View style={[styles.loadingRow, { backgroundColor: colors.card }]}>
        <ActivityIndicator color={colors.primary} size="small" />
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
          {symbol.replace("USDT", "")} · Analyzing…
        </Text>
      </View>
    );
  }

  if (!analysis) return null;
  if (filter !== "ALL" && analysis.signal !== filter) return null;

  return <SignalCard analysis={analysis} symbol={symbol} />;
}

function FilterPill({
  label,
  active,
  color,
  onPress,
  colors,
}: {
  label: string;
  active: boolean;
  color: string;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.filterPill,
        {
          backgroundColor: active ? `${color}20` : colors.secondary,
          borderColor: active ? color : colors.border,
        },
      ]}
    >
      <Text style={[styles.filterText, { color: active ? color : colors.mutedForeground }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function SignalsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const [interval, setTimeframe] = useState("1h");
  const [filter, setFilter] = useState<"ALL" | "BUY" | "SELL" | "HOLD">("ALL");
  const [tick, setTick] = useState(0);

  const { checkAlerts } = useAlerts();
  const { recordSignal } = useSignalHistory();

  useEffect(() => {
    const ms = interval === "1m" ? 15_000 : interval === "5m" ? 30_000 : 60_000;
    const id = globalThis.setInterval(() => setTick((t) => t + 1), ms);
    return () => globalThis.clearInterval(id);
  }, [interval]);

  const filters: { label: string; value: typeof filter; color: string }[] = [
    { label: "All", value: "ALL", color: colors.foreground },
    { label: "BUY", value: "BUY", color: colors.bullish },
    { label: "SELL", value: "SELL", color: colors.bearish },
    { label: "HOLD", value: "HOLD", color: colors.neutral },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.background }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Signals</Text>
            <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
              RSI · EMA 9/21 · MACD
            </Text>
          </View>
          <View style={[styles.liveBadge, { backgroundColor: `${colors.bullish}18`, borderColor: `${colors.bullish}40` }]}>
            <View style={[styles.liveDot, { backgroundColor: colors.bullish }]} />
            <Text style={[styles.liveText, { color: colors.bullish }]}>LIVE</Text>
          </View>
        </View>
      </View>

      <View style={styles.intervalRow}>
        {SIGNAL_INTERVALS.map((iv) => (
          <TouchableOpacity
            key={iv.value}
            onPress={() => setTimeframe(iv.value)}
            style={[
              styles.intervalBtn,
              {
                backgroundColor: interval === iv.value ? colors.primary : colors.secondary,
                borderColor: interval === iv.value ? colors.primary : colors.border,
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

      <View style={styles.filterRow}>
        {filters.map((f) => (
          <FilterPill
            key={f.value}
            label={f.label}
            active={filter === f.value}
            color={f.color}
            onPress={() => setFilter(f.value)}
            colors={colors}
          />
        ))}
      </View>

      <FlatList
        key={`${interval}-${tick}`}
        data={TRADING_PAIRS}
        keyExtractor={(item) => item.symbol}
        renderItem={({ item, index }) => (
          <SignalItem
            symbol={item.symbol}
            interval={interval}
            filter={filter}
            index={index}
            checkAlerts={checkAlerts}
            recordSignal={recordSignal}
          />
        )}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
  },
  intervalRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 10,
  },
  intervalBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
  },
  intervalText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 12,
  },
  filterPill: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 20,
    alignItems: "center",
    borderWidth: 1,
  },
  filterText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 16,
    borderRadius: 14,
    marginBottom: 10,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
});
