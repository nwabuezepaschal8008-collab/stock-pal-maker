import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useSignalHistory } from "@/hooks/useSignalHistory";

function WinRateRing({ rate, size = 100 }: { rate: number; size?: number }) {
  const colors = useColors();
  const pct = Math.round(rate);
  const color = pct >= 60 ? colors.bullish : pct >= 40 ? colors.neutral : colors.bearish;

  return (
    <View style={[styles.ring, { width: size, height: size, borderRadius: size / 2, borderColor: color }]}>
      <Text style={[styles.ringPct, { color, fontSize: size * 0.26 }]}>{pct}%</Text>
      <Text style={[styles.ringLabel, { color: colors.mutedForeground, fontSize: size * 0.1 }]}>WIN RATE</Text>
    </View>
  );
}

function StatBox({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) {
  const colors = useColors();
  return (
    <View style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.statValue, { color: accent ?? colors.foreground }]}>{value}</Text>
      {sub !== undefined && <Text style={[styles.statSub, { color: colors.mutedForeground }]}>{sub}</Text>}
    </View>
  );
}

function PairStatRow({ stat, colors }: { stat: ReturnType<ReturnType<typeof useSignalHistory>["getStats"]>[number]; colors: any }) {
  const resolved = stat.wins + stat.losses;
  const wr = resolved > 0 ? (stat.wins / resolved) * 100 : 0;
  const wrColor = wr >= 60 ? colors.bullish : wr >= 40 ? colors.neutral : colors.bearish;

  return (
    <View style={[styles.pairRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.pairIcon, { backgroundColor: colors.secondary }]}>
        <Text style={[styles.pairIconText, { color: colors.primary }]}>
          {stat.symbol.replace("USDT", "").charAt(0)}
        </Text>
      </View>
      <View style={styles.pairInfo}>
        <Text style={[styles.pairSymbol, { color: colors.foreground }]}>
          {stat.symbol.replace("USDT", "")}/USDT
        </Text>
        <Text style={[styles.pairMeta, { color: colors.mutedForeground }]}>
          {stat.totalSignals} signals · {Math.round(stat.avgConfidence)}% avg conf
        </Text>
      </View>
      <View style={styles.pairStats}>
        <Text style={[styles.pairWR, { color: wrColor }]}>
          {resolved > 0 ? `${Math.round(wr)}%` : "—"}
        </Text>
        <Text style={[styles.pairWL, { color: colors.mutedForeground }]}>
          {stat.wins}W / {stat.losses}L
        </Text>
      </View>
      {stat.lastSignal && (
        <View
          style={[
            styles.signalBadge,
            {
              backgroundColor:
                stat.lastSignal === "BUY"
                  ? colors.bullish + "20"
                  : stat.lastSignal === "SELL"
                  ? colors.bearish + "20"
                  : colors.neutral + "20",
            },
          ]}
        >
          <Text
            style={[
              styles.signalBadgeText,
              {
                color:
                  stat.lastSignal === "BUY"
                    ? colors.bullish
                    : stat.lastSignal === "SELL"
                    ? colors.bearish
                    : colors.neutral,
              },
            ]}
          >
            {stat.lastSignal}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function AnalyticsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const { records, overallStats, getStats, clearHistory } = useSignalHistory();

  const overall = useMemo(() => overallStats(), [overallStats, records]);
  const pairStats = useMemo(
    () => getStats().sort((a, b) => b.totalSignals - a.totalSignals),
    [getStats, records],
  );

  const recentRecords = useMemo(
    () => records.filter((r) => r.signal !== "HOLD").slice(0, 20),
    [records],
  );

  const buyCount = records.filter((r) => r.signal === "BUY").length;
  const sellCount = records.filter((r) => r.signal === "SELL").length;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 90 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <View>
          <Text style={[styles.title, { color: colors.foreground }]}>Analytics</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Signal performance tracker
          </Text>
        </View>
        {records.length > 0 && (
          <TouchableOpacity onPress={clearHistory}>
            <Text style={[styles.clearText, { color: colors.bearish }]}>Reset</Text>
          </TouchableOpacity>
        )}
      </View>

      {records.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No signals tracked yet</Text>
          <Text style={[styles.emptyHint, { color: colors.mutedForeground }]}>
            Visit the Signals tab to start generating signals. Performance data builds automatically over time.
          </Text>
        </View>
      ) : (
        <>
          <View style={[styles.overviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>OVERALL PERFORMANCE</Text>
            <View style={styles.overviewRow}>
              <WinRateRing rate={overall.winRate} size={100} />
              <View style={styles.overviewStats}>
                <View style={styles.overviewStat}>
                  <Text style={[styles.overviewVal, { color: colors.foreground }]}>{overall.total}</Text>
                  <Text style={[styles.overviewLbl, { color: colors.mutedForeground }]}>Total Signals</Text>
                </View>
                <View style={styles.overviewStat}>
                  <Text style={[styles.overviewVal, { color: colors.bullish }]}>{overall.wins}</Text>
                  <Text style={[styles.overviewLbl, { color: colors.mutedForeground }]}>Wins</Text>
                </View>
                <View style={styles.overviewStat}>
                  <Text style={[styles.overviewVal, { color: colors.bearish }]}>{overall.losses}</Text>
                  <Text style={[styles.overviewLbl, { color: colors.mutedForeground }]}>Losses</Text>
                </View>
                <View style={styles.overviewStat}>
                  <Text style={[styles.overviewVal, { color: colors.neutral }]}>{overall.pending}</Text>
                  <Text style={[styles.overviewLbl, { color: colors.mutedForeground }]}>Pending</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.statGrid}>
            <StatBox label="BUY Signals" value={buyCount} accent={colors.bullish} />
            <StatBox label="SELL Signals" value={sellCount} accent={colors.bearish} />
            <StatBox
              label="Resolved"
              value={overall.wins + overall.losses}
              sub={`${overall.pending} pending`}
            />
            <StatBox
              label="Accuracy"
              value={`${Math.round(overall.winRate)}%`}
              accent={overall.winRate >= 55 ? colors.bullish : overall.winRate >= 40 ? colors.neutral : colors.bearish}
            />
          </View>

          {pairStats.length > 0 && (
            <>
              <Text style={[styles.sectionHeader, { color: colors.mutedForeground }]}>PER-PAIR BREAKDOWN</Text>
              <View style={styles.pairList}>
                {pairStats.map((stat) => (
                  <PairStatRow key={stat.symbol} stat={stat} colors={colors} />
                ))}
              </View>
            </>
          )}

          {recentRecords.length > 0 && (
            <>
              <Text style={[styles.sectionHeader, { color: colors.mutedForeground }]}>RECENT SIGNALS</Text>
              <View style={styles.recentList}>
                {recentRecords.map((rec) => {
                  const isBuy = rec.signal === "BUY";
                  const sigColor = isBuy ? colors.bullish : colors.bearish;
                  const outcomeColor =
                    rec.outcome === "WIN"
                      ? colors.bullish
                      : rec.outcome === "LOSS"
                      ? colors.bearish
                      : colors.neutral;
                  const ts = new Date(rec.timestamp);
                  const timeStr = `${ts.getMonth() + 1}/${ts.getDate()} ${ts.getHours()}:${String(ts.getMinutes()).padStart(2, "0")}`;
                  return (
                    <View
                      key={rec.id}
                      style={[styles.recentRow, { backgroundColor: colors.card, borderColor: colors.border }]}
                    >
                      <View style={[styles.sigDot, { backgroundColor: sigColor }]} />
                      <Text style={[styles.recentSymbol, { color: colors.foreground }]}>
                        {rec.symbol.replace("USDT", "")}
                      </Text>
                      <Text style={[styles.recentSig, { color: sigColor }]}>{rec.signal}</Text>
                      <Text style={[styles.recentConf, { color: colors.mutedForeground }]}>
                        {Math.round(rec.confidence)}%
                      </Text>
                      <View style={styles.recentRight}>
                        <Text style={[styles.recentOutcome, { color: outcomeColor }]}>
                          {rec.outcome === "PENDING" ? "⏳" : rec.outcome === "WIN" ? "✓ WIN" : "✗ LOSS"}
                        </Text>
                        <Text style={[styles.recentTime, { color: colors.mutedForeground }]}>{timeStr}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  subtitle: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  clearText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  empty: {
    alignItems: "center",
    paddingHorizontal: 32,
    paddingTop: 80,
    gap: 12,
  },
  emptyIcon: { fontSize: 52 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  emptyHint: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  overviewCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.2,
    marginBottom: 14,
  },
  overviewRow: { flexDirection: "row", alignItems: "center", gap: 24 },
  ring: {
    borderWidth: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  ringPct: { fontFamily: "Inter_700Bold" },
  ringLabel: { fontFamily: "Inter_600SemiBold", letterSpacing: 0.8 },
  overviewStats: { flex: 1, flexDirection: "row", flexWrap: "wrap", gap: 12 },
  overviewStat: { width: "40%" },
  overviewVal: { fontSize: 22, fontFamily: "Inter_700Bold" },
  overviewLbl: { fontSize: 11, fontFamily: "Inter_400Regular" },
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 14,
  },
  statBox: {
    width: "47%",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  statLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, marginBottom: 6 },
  statValue: { fontSize: 22, fontFamily: "Inter_700Bold" },
  statSub: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  sectionHeader: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.2,
    paddingHorizontal: 20,
    marginBottom: 10,
    marginTop: 4,
  },
  pairList: { paddingHorizontal: 16, gap: 8, marginBottom: 16 },
  pairRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    gap: 10,
  },
  pairIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  pairIconText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  pairInfo: { flex: 1 },
  pairSymbol: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  pairMeta: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  pairStats: { alignItems: "flex-end" },
  pairWR: { fontSize: 16, fontFamily: "Inter_700Bold" },
  pairWL: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  signalBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  signalBadgeText: { fontSize: 11, fontFamily: "Inter_700Bold" },
  recentList: { paddingHorizontal: 16, gap: 6, marginBottom: 16 },
  recentRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    gap: 10,
  },
  sigDot: { width: 6, height: 6, borderRadius: 3 },
  recentSymbol: { fontSize: 13, fontFamily: "Inter_600SemiBold", width: 36 },
  recentSig: { fontSize: 12, fontFamily: "Inter_700Bold", width: 36 },
  recentConf: { fontSize: 12, fontFamily: "Inter_400Regular", width: 32 },
  recentRight: { flex: 1, alignItems: "flex-end" },
  recentOutcome: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  recentTime: { fontSize: 10, fontFamily: "Inter_400Regular", marginTop: 2 },
});
