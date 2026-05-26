import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  useColorScheme,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useKlines } from "../../hooks/useKlines";
import { MiniChart } from "../../components/MiniChart";
import { TRADING_PAIRS, INTERVALS } from "../../constants/symbols";

function PairRow({ symbol, name, base }: { symbol: string; name: string; base: string }) {
  const colors = useColors();
  const { data, isLoading } = useKlines(symbol, "1h");

  const close = data?.[data.length - 1]?.close ?? 0;
  const open = data?.[0]?.open ?? close;
  const change = open > 0 ? ((close - open) / open) * 100 : 0;
  const isUp = change >= 0;
  const prices = data?.slice(-20).map((k) => k.close) ?? [];
  const priceFormatted =
    close >= 1000
      ? close.toLocaleString("en-US", { maximumFractionDigits: 2 })
      : close < 1
      ? close.toFixed(5)
      : close.toFixed(2);

  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <View style={styles.coinInfo}>
        <View style={[styles.coinIcon, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.coinIconText, { color: colors.primary }]}>{base.charAt(0)}</Text>
        </View>
        <View>
          <Text style={[styles.coinSymbol, { color: colors.foreground }]}>{base}</Text>
          <Text style={[styles.coinName, { color: colors.mutedForeground }]}>{name}</Text>
        </View>
      </View>

      <View style={styles.chartWrap}>
        {prices.length >= 2 && <MiniChart prices={prices} bullish={isUp} />}
      </View>

      <View style={styles.priceInfo}>
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <>
            <Text style={[styles.price, { color: colors.foreground }]}>${priceFormatted}</Text>
            <View style={[styles.changePill, { backgroundColor: isUp ? `${colors.bullish}20` : `${colors.bearish}20` }]}>
              <Text style={[styles.change, { color: isUp ? colors.bullish : colors.bearish }]}>
                {isUp ? "+" : ""}{change.toFixed(2)}%
              </Text>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

export default function MarketsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setRefreshKey((k) => k + 1);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.background }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Markets</Text>
        <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>Live Binance Data</Text>
      </View>

      <View style={[styles.intervalRow, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
        {INTERVALS.map((iv) => (
          <Text key={iv.value} style={[styles.intervalLabel, { color: colors.mutedForeground }]}>
            {iv.label}
          </Text>
        ))}
      </View>

      <FlatList
        key={refreshKey}
        data={TRADING_PAIRS}
        keyExtractor={(item) => item.symbol}
        renderItem={({ item }) => (
          <PairRow symbol={item.symbol} name={item.name} base={item.base} />
        )}
        contentContainerStyle={{ paddingBottom: insets.bottom + 90 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
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
  intervalRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 8,
    marginHorizontal: 16,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
  },
  intervalLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  coinInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    width: 120,
  },
  coinIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  coinIconText: {
    fontSize: 16,
    fontWeight: "700",
  },
  coinSymbol: {
    fontSize: 15,
    fontWeight: "600",
  },
  coinName: {
    fontSize: 12,
    marginTop: 1,
  },
  chartWrap: {
    flex: 1,
    alignItems: "center",
  },
  priceInfo: {
    alignItems: "flex-end",
    minWidth: 90,
  },
  price: {
    fontSize: 15,
    fontWeight: "600",
  },
  changePill: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
  },
  change: {
    fontSize: 12,
    fontWeight: "600",
  },
});
