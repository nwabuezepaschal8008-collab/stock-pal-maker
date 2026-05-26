import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useKlines } from "../../hooks/useKlines";
import { MiniChart } from "../../components/MiniChart";
import { SentimentMeter } from "../../components/SentimentMeter";
import { FavoriteButton } from "../../components/FavoriteButton";
import { useFavorites } from "../../hooks/useFavorites";
import { analyzeSignal } from "../../utils/signals";
import { TRADING_PAIRS } from "../../constants/symbols";

type SortMode = "default" | "gainers" | "losers" | "favorites";

function usePairData(symbol: string, index: number) {
  const { data, isLoading } = useKlines(symbol, "1h", index);
  const close = data?.[data.length - 1]?.close ?? 0;
  const open = data?.[0]?.open ?? close;
  const change = open > 0 ? ((close - open) / open) * 100 : 0;
  const prices = data?.slice(-20).map((k) => k.close) ?? [];
  const sentimentScore = useMemo(() => {
    if (!data || data.length < 50) return null;
    const a = analyzeSignal(data);
    return a.indicators.rsi.score * 0.3 + a.indicators.ema.score * 0.35 + a.indicators.macd.score * 0.35;
  }, [data]);
  return { close, change, prices, isLoading, sentimentScore };
}

function PriceFormatted({ price }: { price: number }) {
  const fmt =
    price >= 1000
      ? price.toLocaleString("en-US", { maximumFractionDigits: 2 })
      : price < 1
      ? price.toFixed(5)
      : price.toFixed(2);
  return <>${fmt}</>;
}

function PairRow({
  symbol,
  name,
  base,
  index,
  isFavorite,
  onToggleFavorite,
}: {
  symbol: string;
  name: string;
  base: string;
  index: number;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}) {
  const colors = useColors();
  const { close, change, prices, isLoading } = usePairData(symbol, index);
  const isUp = change >= 0;

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
            <Text style={[styles.price, { color: colors.foreground }]}>
              <PriceFormatted price={close} />
            </Text>
            <View
              style={[
                styles.changePill,
                { backgroundColor: isUp ? `${colors.bullish}20` : `${colors.bearish}20` },
              ]}
            >
              <Text style={[styles.change, { color: isUp ? colors.bullish : colors.bearish }]}>
                {isUp ? "+" : ""}
                {change.toFixed(2)}%
              </Text>
            </View>
          </>
        )}
      </View>

      <FavoriteButton active={isFavorite} onToggle={onToggleFavorite} size={17} />
    </View>
  );
}

function TopGainersRow({ pairs, isFavorite, onToggleFavorite }: {
  pairs: Array<{ symbol: string; base: string; change: number; close: number }>;
  isFavorite: (s: string) => boolean;
  onToggleFavorite: (s: string) => void;
}) {
  const colors = useColors();
  if (pairs.length === 0) return null;

  return (
    <View style={styles.gainersSection}>
      <Text style={[styles.gainersLabel, { color: colors.mutedForeground }]}>TOP MOVERS</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gainersRow}>
        {pairs.map((p) => {
          const isUp = p.change >= 0;
          return (
            <View
              key={p.symbol}
              style={[
                styles.gainerCard,
                {
                  backgroundColor: colors.card,
                  borderColor: isUp ? colors.bullish + "30" : colors.bearish + "30",
                },
              ]}
            >
              <View style={styles.gainerTop}>
                <View style={[styles.gainerIcon, { backgroundColor: isUp ? colors.bullish + "20" : colors.bearish + "20" }]}>
                  <Text style={[styles.gainerIconText, { color: isUp ? colors.bullish : colors.bearish }]}>
                    {p.base.charAt(0)}
                  </Text>
                </View>
                <FavoriteButton
                  active={isFavorite(p.symbol)}
                  onToggle={() => onToggleFavorite(p.symbol)}
                  size={14}
                />
              </View>
              <Text style={[styles.gainerBase, { color: colors.foreground }]}>{p.base}</Text>
              <Text style={[styles.gainerChange, { color: isUp ? colors.bullish : colors.bearish }]}>
                {isUp ? "+" : ""}{p.change.toFixed(2)}%
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

function PairDataCollector({
  symbol,
  index,
  onData,
}: {
  symbol: string;
  index: number;
  onData: (symbol: string, d: { change: number; close: number; score: number | null }) => void;
}) {
  const { change, close, sentimentScore } = usePairData(symbol, index);
  useEffect(() => {
    onData(symbol, { change, close, score: sentimentScore });
  }, [change, close, sentimentScore]);
  return null;
}

export default function MarketsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("default");
  const [pairData, setPairData] = useState<Record<string, { change: number; close: number; score: number | null }>>({});

  const { toggle, isFavorite } = useFavorites();

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setRefreshKey((k) => k + 1);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const sentimentScore = useMemo(() => {
    const scores = Object.values(pairData)
      .map((d) => d.score)
      .filter((s): s is number => s !== null);
    return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 50;
  }, [pairData]);

  const sortedPairs = useMemo(() => {
    const arr = [...TRADING_PAIRS];
    if (sortMode === "gainers") {
      return arr.sort((a, b) => (pairData[b.symbol]?.change ?? 0) - (pairData[a.symbol]?.change ?? 0));
    }
    if (sortMode === "losers") {
      return arr.sort((a, b) => (pairData[a.symbol]?.change ?? 0) - (pairData[b.symbol]?.change ?? 0));
    }
    if (sortMode === "favorites") {
      return arr.sort((a, b) => (isFavorite(b.symbol) ? 1 : 0) - (isFavorite(a.symbol) ? 1 : 0));
    }
    return arr;
  }, [sortMode, pairData, isFavorite]);

  const topMovers = useMemo(() => {
    return TRADING_PAIRS
      .map((p) => ({
        symbol: p.symbol,
        base: p.base,
        change: pairData[p.symbol]?.change ?? 0,
        close: pairData[p.symbol]?.close ?? 0,
      }))
      .filter((p) => Math.abs(p.change) > 0)
      .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
      .slice(0, 5);
  }, [pairData]);

  const SORT_TABS: { label: string; mode: SortMode; icon: string }[] = [
    { label: "All", mode: "default", icon: "list" },
    { label: "Gainers", mode: "gainers", icon: "trending-up" },
    { label: "Losers", mode: "losers", icon: "trending-down" },
    { label: "Watchlist", mode: "favorites", icon: "star" },
  ];

  const handlePairData = useCallback(
    (symbol: string, d: { change: number; close: number; score: number | null }) => {
      setPairData((prev) => {
        if (prev[symbol]?.change === d.change && prev[symbol]?.score === d.score) return prev;
        return { ...prev, [symbol]: d };
      });
    },
    [],
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {TRADING_PAIRS.map((p, i) => (
        <PairDataCollector key={p.symbol} symbol={p.symbol} index={i} onData={handlePairData} />
      ))}

      <View
        style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.background }]}
      >
        <View>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Markets</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>Live Binance Data</Text>
        </View>
        <View style={[styles.liveBadge, { backgroundColor: colors.bullish + "20" }]}>
          <View style={[styles.liveDot, { backgroundColor: colors.bullish }]} />
          <Text style={[styles.liveText, { color: colors.bullish }]}>LIVE</Text>
        </View>
      </View>

      <FlatList
        key={refreshKey}
        data={sortedPairs}
        keyExtractor={(item) => item.symbol}
        renderItem={({ item, index }) => (
          <PairRow
            symbol={item.symbol}
            name={item.name}
            base={item.base}
            index={index}
            isFavorite={isFavorite(item.symbol)}
            onToggleFavorite={() => toggle(item.symbol)}
          />
        )}
        contentContainerStyle={{ paddingBottom: insets.bottom + 90 }}
        ListHeaderComponent={
          <>
            <SentimentMeter score={sentimentScore} />
            <TopGainersRow
              pairs={topMovers}
              isFavorite={isFavorite}
              onToggleFavorite={toggle}
            />
            <View style={[styles.sortRow, { borderBottomColor: colors.border }]}>
              {SORT_TABS.map((t) => (
                <TouchableOpacity
                  key={t.mode}
                  onPress={() => setSortMode(t.mode)}
                  style={[
                    styles.sortBtn,
                    sortMode === t.mode && {
                      backgroundColor: colors.primary + "15",
                      borderBottomColor: colors.primary,
                      borderBottomWidth: 2,
                    },
                  ]}
                >
                  <Feather
                    name={t.icon as any}
                    size={13}
                    color={sortMode === t.mode ? colors.primary : colors.mutedForeground}
                  />
                  <Text
                    style={[
                      styles.sortText,
                      { color: sortMode === t.mode ? colors.primary : colors.mutedForeground },
                    ]}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        }
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
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  headerSub: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  liveText: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  gainersSection: { marginBottom: 8 },
  gainersLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.2,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  gainersRow: { paddingHorizontal: 16, gap: 10 },
  gainerCard: {
    width: 90,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
  },
  gainerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  gainerIcon: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  gainerIconText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  gainerBase: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  gainerChange: { fontSize: 12, fontFamily: "Inter_700Bold" },
  sortRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    marginHorizontal: 16,
    marginBottom: 4,
  },
  sortBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 10,
    marginBottom: -1,
  },
  sortText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 6,
  },
  coinInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    width: 110,
  },
  coinIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  coinIconText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  coinSymbol: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  coinName: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  chartWrap: { flex: 1, alignItems: "center" },
  priceInfo: { alignItems: "flex-end", minWidth: 85 },
  price: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  changePill: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
  },
  change: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
});
