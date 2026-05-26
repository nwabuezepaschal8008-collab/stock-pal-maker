import React from "react";
import { View, Text, TouchableOpacity, Switch, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { type PriceAlert } from "@/hooks/useAlerts";
import { useColors } from "@/hooks/useColors";

type Props = {
  alert: PriceAlert;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
};

const TYPE_ICONS: Record<string, string> = {
  price_above: "trending-up",
  price_below: "trending-down",
  signal_buy: "zap",
  signal_sell: "zap-off",
};

const TYPE_LABELS: Record<string, string> = {
  price_above: "Price Above",
  price_below: "Price Below",
  signal_buy: "BUY Signal",
  signal_sell: "SELL Signal",
};

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function AlertRow({ alert, onToggle, onRemove }: Props) {
  const colors = useColors();
  const icon = TYPE_ICONS[alert.type] as any;
  const label = TYPE_LABELS[alert.type];

  const isBullish = alert.type === "price_above" || alert.type === "signal_buy";
  const accentColor = isBullish ? colors.bullish : colors.bearish;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: alert.enabled ? accentColor + "40" : colors.border,
        },
      ]}
    >
      <View style={[styles.iconWrapper, { backgroundColor: accentColor + "20" }]}>
        <Feather name={icon} size={16} color={accentColor} />
      </View>

      <View style={styles.info}>
        <View style={styles.topRow}>
          <Text style={[styles.symbol, { color: colors.foreground }]}>
            {alert.symbol.replace("USDT", "")}/USDT
          </Text>
          <Text style={[styles.typeLabel, { color: accentColor }]}>{label}</Text>
        </View>
        {alert.targetPrice !== undefined && (
          <Text style={[styles.price, { color: colors.mutedForeground }]}>
            Target: ${alert.targetPrice.toLocaleString()}
          </Text>
        )}
        <View style={styles.metaRow}>
          <Text style={[styles.meta, { color: colors.mutedForeground }]}>
            Created {timeAgo(alert.createdAt)}
          </Text>
          {alert.triggerCount > 0 && (
            <Text style={[styles.meta, { color: colors.primary }]}>
              ⚡ {alert.triggerCount}× triggered
            </Text>
          )}
          {alert.telegramEnabled && (
            <Text style={[styles.meta, { color: "#2196f3" }]}>📱 Telegram</Text>
          )}
        </View>
      </View>

      <View style={styles.actions}>
        <Switch
          value={alert.enabled}
          onValueChange={() => onToggle(alert.id)}
          trackColor={{ false: colors.border, true: accentColor + "80" }}
          thumbColor={alert.enabled ? accentColor : colors.mutedForeground}
          style={styles.switch}
        />
        <TouchableOpacity onPress={() => onRemove(alert.id)} hitSlop={8}>
          <Feather name="trash-2" size={14} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    gap: 12,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  info: { flex: 1 },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  symbol: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  typeLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  price: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  meta: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
  },
  actions: {
    alignItems: "center",
    gap: 8,
  },
  switch: { transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] },
});
