import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { type SignalAnalysis } from "../utils/signals";
import { useColors } from "@/hooks/useColors";

type Props = {
  analysis: SignalAnalysis;
  symbol: string;
  price: number;
};

export function SignalCard({ analysis, symbol, price }: Props) {
  const colors = useColors();

  const signalColor =
    analysis.signal === "BUY"
      ? colors.bullish
      : analysis.signal === "SELL"
      ? colors.bearish
      : colors.neutral;

  const priceFormatted =
    price >= 1000
      ? price.toLocaleString("en-US", { maximumFractionDigits: 2 })
      : price.toFixed(4);

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: `${signalColor}33` }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.symbol, { color: colors.foreground }]}>{symbol.replace("USDT", "")}</Text>
          <Text style={[styles.price, { color: colors.foreground }]}>${priceFormatted}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: `${signalColor}20`, borderColor: signalColor }]}>
          <Text style={[styles.badgeText, { color: signalColor }]}>{analysis.signal}</Text>
          <Text style={[styles.strength, { color: signalColor }]}>{analysis.strength}%</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <Stat label="RSI" value={analysis.rsi.toFixed(1)} color={analysis.rsi < 30 ? colors.bullish : analysis.rsi > 70 ? colors.bearish : colors.mutedForeground} colors={colors} />
        <Stat label="MA7" value={analysis.ma7 >= 1000 ? `${(analysis.ma7 / 1000).toFixed(2)}k` : analysis.ma7.toFixed(2)} colors={colors} />
        <Stat label="MA25" value={analysis.ma25 >= 1000 ? `${(analysis.ma25 / 1000).toFixed(2)}k` : analysis.ma25.toFixed(2)} colors={colors} />
        <Stat
          label="Change"
          value={`${analysis.priceChange > 0 ? "+" : ""}${analysis.priceChange.toFixed(2)}%`}
          color={analysis.priceChange >= 0 ? colors.bullish : colors.bearish}
          colors={colors}
        />
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={styles.reasons}>
        {analysis.reasons.map((r, i) => (
          <View key={i} style={styles.reason}>
            <View style={[styles.dot, { backgroundColor: signalColor }]} />
            <Text style={[styles.reasonText, { color: colors.mutedForeground }]}>{r}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function Stat({
  label,
  value,
  color,
  colors,
}: {
  label: string;
  value: string;
  color?: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.statValue, { color: color ?? colors.foreground }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  symbol: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  price: {
    fontSize: 14,
    marginTop: 2,
    fontWeight: "500",
  },
  badge: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: "center",
  },
  badgeText: {
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 1,
  },
  strength: {
    fontSize: 11,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  stat: {
    alignItems: "center",
  },
  statLabel: {
    fontSize: 10,
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 13,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    marginBottom: 12,
  },
  reasons: {
    gap: 6,
  },
  reason: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  reasonText: {
    fontSize: 12,
    flex: 1,
  },
});
