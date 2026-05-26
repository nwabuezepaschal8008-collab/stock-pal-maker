import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { type SignalAnalysis } from "../utils/signals";
import { useColors } from "@/hooks/useColors";

type Props = {
  analysis: SignalAnalysis;
  symbol: string;
};

function fmtPrice(p: number): string {
  if (p >= 1000) return p.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (p >= 1) return p.toFixed(4);
  return p.toFixed(6);
}

function IndicatorRow({
  label,
  score,
  detail,
  colors,
}: {
  label: string;
  score: number;
  detail: string;
  colors: ReturnType<typeof useColors>;
}) {
  const barColor =
    score >= 62 ? colors.bullish : score <= 38 ? colors.bearish : colors.neutral;
  const pct = `${score}%`;

  return (
    <View style={styles.indicatorRow}>
      <View style={styles.indicatorMeta}>
        <Text style={[styles.indicatorLabel, { color: colors.foreground }]}>{label}</Text>
        <Text style={[styles.indicatorDetail, { color: colors.mutedForeground }]}>{detail}</Text>
      </View>
      <View style={[styles.barTrack, { backgroundColor: colors.secondary }]}>
        <View style={[styles.barFill, { width: pct as any, backgroundColor: barColor }]} />
      </View>
      <Text style={[styles.scoreText, { color: barColor, minWidth: 32 }]}>{score}</Text>
    </View>
  );
}

function PriceLevel({
  label,
  value,
  color,
  note,
  colors,
}: {
  label: string;
  value: number;
  color: string;
  note?: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={[styles.levelBox, { backgroundColor: `${color}12`, borderColor: `${color}30` }]}>
      <Text style={[styles.levelLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.levelValue, { color }]}>${fmtPrice(value)}</Text>
      {note && <Text style={[styles.levelNote, { color: colors.mutedForeground }]}>{note}</Text>}
    </View>
  );
}

export function SignalCard({ analysis, symbol }: Props) {
  const colors = useColors();
  const flashAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(flashAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(flashAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, [analysis.updatedAt]);

  const signalColor =
    analysis.signal === "BUY"
      ? colors.bullish
      : analysis.signal === "SELL"
      ? colors.bearish
      : colors.neutral;

  const slPct =
    analysis.entryPrice > 0
      ? (((analysis.stopLoss - analysis.entryPrice) / analysis.entryPrice) * 100).toFixed(2)
      : "0";
  const tpPct =
    analysis.entryPrice > 0
      ? (((analysis.takeProfit - analysis.entryPrice) / analysis.entryPrice) * 100).toFixed(2)
      : "0";

  const borderOpacity = flashAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 0.8],
  });

  const time = new Date(analysis.updatedAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: flashAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [`${signalColor}33`, `${signalColor}cc`],
          }),
        },
      ]}
    >
      <View style={styles.header}>
        <View>
          <Text style={[styles.symbol, { color: colors.foreground }]}>
            {symbol.replace("USDT", "")}
            <Text style={[styles.quote, { color: colors.mutedForeground }]}>/USDT</Text>
          </Text>
          <Text style={[styles.updatedAt, { color: colors.mutedForeground }]}>
            Updated {time}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: `${signalColor}18`, borderColor: signalColor }]}>
          <Text style={[styles.signalText, { color: signalColor }]}>{analysis.signal}</Text>
          <View style={styles.confidenceRow}>
            <View style={[styles.confidenceDot, { backgroundColor: signalColor }]} />
            <Text style={[styles.confidenceText, { color: signalColor }]}>
              {analysis.confidence}% confidence
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.priceLevels}>
        <PriceLevel
          label="Entry"
          value={analysis.entryPrice}
          color={colors.foreground}
          colors={colors}
        />
        <PriceLevel
          label="Stop Loss"
          value={analysis.stopLoss}
          color={colors.bearish}
          note={`${Number(slPct) >= 0 ? "+" : ""}${slPct}%`}
          colors={colors}
        />
        <PriceLevel
          label="Take Profit"
          value={analysis.takeProfit}
          color={colors.bullish}
          note={`${Number(tpPct) >= 0 ? "+" : ""}${tpPct}%`}
          colors={colors}
        />
      </View>

      <View style={[styles.rrRow, { backgroundColor: colors.secondary }]}>
        <Text style={[styles.rrLabel, { color: colors.mutedForeground }]}>
          Risk/Reward
        </Text>
        <Text style={[styles.rrValue, { color: colors.foreground }]}>
          1 : {analysis.riskRewardRatio.toFixed(2)}
        </Text>
        <Text style={[styles.rrSep, { color: colors.border }]}>·</Text>
        <Text style={[styles.rrLabel, { color: colors.mutedForeground }]}>ATR</Text>
        <Text style={[styles.rrValue, { color: colors.foreground }]}>
          {analysis.entryPrice > 0
            ? ((analysis.atr / analysis.entryPrice) * 100).toFixed(2) + "%"
            : "—"}
        </Text>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={styles.indicators}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
          INDICATORS
        </Text>
        <IndicatorRow
          label="RSI(14)"
          score={analysis.indicators.rsi.score}
          detail={`${analysis.indicators.rsi.value.toFixed(1)}`}
          colors={colors}
        />
        <IndicatorRow
          label="EMA 9/21"
          score={analysis.indicators.ema.score}
          detail={`${fmtPrice(analysis.indicators.ema.ema9)} / ${fmtPrice(analysis.indicators.ema.ema21)}`}
          colors={colors}
        />
        <IndicatorRow
          label="MACD"
          score={analysis.indicators.macd.score}
          detail={`H: ${analysis.indicators.macd.histogram > 0 ? "+" : ""}${analysis.indicators.macd.histogram.toFixed(4)}`}
          colors={colors}
        />
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={styles.reasons}>
        {analysis.reasons.map((r, i) => {
          const score =
            i === 0
              ? analysis.indicators.rsi.score
              : i === 1
              ? analysis.indicators.ema.score
              : analysis.indicators.macd.score;
          const dotColor =
            score >= 62 ? colors.bullish : score <= 38 ? colors.bearish : colors.neutral;
          return (
            <View key={i} style={styles.reason}>
              <View style={[styles.dot, { backgroundColor: dotColor }]} />
              <Text style={[styles.reasonText, { color: colors.mutedForeground }]}>{r}</Text>
            </View>
          );
        })}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  symbol: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  quote: {
    fontSize: 14,
    fontWeight: "400",
  },
  updatedAt: {
    fontSize: 11,
    marginTop: 3,
  },
  badge: {
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center",
    minWidth: 110,
  },
  signalText: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  confidenceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
  },
  confidenceDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: "600",
  },
  priceLevels: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  levelBox: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    alignItems: "center",
  },
  levelLabel: {
    fontSize: 10,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  levelValue: {
    fontSize: 12,
    fontWeight: "700",
  },
  levelNote: {
    fontSize: 10,
    marginTop: 2,
  },
  rrRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    marginBottom: 12,
  },
  rrLabel: { fontSize: 11 },
  rrValue: { fontSize: 12, fontWeight: "700" },
  rrSep: { fontSize: 14, marginHorizontal: 4 },
  divider: {
    height: 1,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 10,
    letterSpacing: 1.5,
    marginBottom: 10,
    fontWeight: "600",
  },
  indicators: {
    marginBottom: 12,
    gap: 10,
  },
  indicatorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  indicatorMeta: {
    width: 72,
  },
  indicatorLabel: {
    fontSize: 11,
    fontWeight: "700",
  },
  indicatorDetail: {
    fontSize: 9,
    marginTop: 1,
  },
  barTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  barFill: {
    height: 6,
    borderRadius: 3,
  },
  scoreText: {
    fontSize: 11,
    fontWeight: "700",
    textAlign: "right",
  },
  reasons: {
    gap: 6,
  },
  reason: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 4,
  },
  reasonText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 17,
  },
});
