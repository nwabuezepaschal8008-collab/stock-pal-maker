import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useColors } from "@/hooks/useColors";

type Props = {
  score: number;
};

function getLabel(score: number): { text: string; emoji: string } {
  if (score >= 75) return { text: "Extreme Greed", emoji: "🔥" };
  if (score >= 60) return { text: "Greed", emoji: "😀" };
  if (score >= 45) return { text: "Neutral", emoji: "😐" };
  if (score >= 30) return { text: "Fear", emoji: "😨" };
  return { text: "Extreme Fear", emoji: "💀" };
}

export function SentimentMeter({ score }: Props) {
  const colors = useColors();
  const pct = Math.max(0, Math.min(100, score));
  const { text, emoji } = getLabel(pct);

  const needleLeft = `${pct}%`;

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Text style={[styles.label, { color: colors.mutedForeground }]}>MARKET SENTIMENT</Text>
        <View style={styles.scoreBadge}>
          <Text style={[styles.emoji]}>{emoji}</Text>
          <Text style={[styles.scoreText, { color: colors.foreground }]}>{text}</Text>
          <Text style={[styles.scoreNum, { color: colors.primary }]}>{Math.round(pct)}</Text>
        </View>
      </View>

      <View style={styles.barWrapper}>
        <LinearGradient
          colors={["#ef4444", "#f97316", "#eab308", "#22c55e", "#16a34a"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        />
        <View
          style={[
            styles.needle,
            { left: needleLeft as any, borderColor: colors.background },
          ]}
        />
      </View>

      <View style={styles.scaleRow}>
        {["Fear", "Neutral", "Greed"].map((lbl) => (
          <Text key={lbl} style={[styles.scaleLabel, { color: colors.mutedForeground }]}>
            {lbl}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  label: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.2,
  },
  scoreBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  emoji: { fontSize: 16 },
  scoreText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  scoreNum: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  barWrapper: {
    height: 12,
    borderRadius: 6,
    overflow: "visible",
    position: "relative",
    marginBottom: 8,
  },
  gradient: {
    height: 12,
    borderRadius: 6,
    flex: 1,
  },
  needle: {
    position: "absolute",
    top: -4,
    width: 4,
    height: 20,
    borderRadius: 2,
    backgroundColor: "#ffffff",
    borderWidth: 2,
    marginLeft: -2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 4,
  },
  scaleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  scaleLabel: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
  },
});
