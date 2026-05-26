import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useKlines } from "../../hooks/useKlines";
import { analyzeSignal } from "../../utils/signals";
import { SignalCard } from "../../components/SignalCard";
import { TRADING_PAIRS } from "../../constants/symbols";

function SignalItem({ symbol, name }: { symbol: string; name: string }) {
  const { data: klines, isLoading } = useKlines(symbol, "1h");
  const colors = useColors();

  if (isLoading) {
    return (
      <View style={[styles.loadingRow, { backgroundColor: colors.card }]}>
        <ActivityIndicator color={colors.primary} size="small" />
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>{symbol}</Text>
      </View>
    );
  }

  if (!klines || klines.length < 26) return null;

  const analysis = analyzeSignal(klines);
  const price = klines[klines.length - 1]?.close ?? 0;

  return <SignalCard analysis={analysis} symbol={symbol} price={price} />;
}

export default function SignalsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.background }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Signals</Text>
        <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
          MA + RSI analysis · 1h chart
        </Text>
      </View>

      <FlatList
        data={TRADING_PAIRS}
        keyExtractor={(item) => item.symbol}
        renderItem={({ item }) => <SignalItem symbol={item.symbol} name={item.name} />}
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
    paddingBottom: 14,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 13,
    marginTop: 2,
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 14,
  },
});
