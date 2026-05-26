import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Switch,
  FlatList,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useAlerts, type AlertType } from "@/hooks/useAlerts";
import { AlertRow } from "@/components/AlertRow";
import { TRADING_PAIRS } from "@/constants/symbols";

type Tab = "active" | "history" | "settings";

const TYPE_OPTIONS: { type: AlertType; label: string; icon: string; desc: string }[] = [
  { type: "price_above", label: "Price Above", icon: "trending-up", desc: "Alert when price crosses above target" },
  { type: "price_below", label: "Price Below", icon: "trending-down", desc: "Alert when price drops below target" },
  { type: "signal_buy", label: "BUY Signal", icon: "zap", desc: "Alert when BUY signal fires" },
  { type: "signal_sell", label: "SELL Signal", icon: "zap-off", desc: "Alert when SELL signal fires" },
];

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function AlertsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const { alerts, history, telegram, addAlert, removeAlert, toggleAlert, saveTelegram, clearHistory } = useAlerts();

  const [tab, setTab] = useState<Tab>("active");
  const [showCreate, setShowCreate] = useState(false);

  const [selectedSymbol, setSelectedSymbol] = useState("BTCUSDT");
  const [selectedType, setSelectedType] = useState<AlertType>("price_above");
  const [targetPrice, setTargetPrice] = useState("");
  const [telegramEnabled, setTelegramEnabled] = useState(false);

  const [tgToken, setTgToken] = useState(telegram.botToken);
  const [tgChatId, setTgChatId] = useState(telegram.chatId);
  const [tgActive, setTgActive] = useState(telegram.enabled);

  const handleCreate = useCallback(async () => {
    const needsPrice = selectedType === "price_above" || selectedType === "price_below";
    const price = parseFloat(targetPrice);
    if (needsPrice && (isNaN(price) || price <= 0)) return;

    await addAlert({
      symbol: selectedSymbol,
      type: selectedType,
      targetPrice: needsPrice ? price : undefined,
      enabled: true,
      telegramEnabled,
    });
    setShowCreate(false);
    setTargetPrice("");
    setTelegramEnabled(false);
    setTab("active");
  }, [selectedSymbol, selectedType, targetPrice, telegramEnabled, addAlert]);

  const handleSaveTelegram = useCallback(async () => {
    await saveTelegram({ botToken: tgToken, chatId: tgChatId, enabled: tgActive });
  }, [tgToken, tgChatId, tgActive, saveTelegram]);

  const typeOpt = TYPE_OPTIONS.find((t) => t.type === selectedType)!;
  const needsPrice = selectedType === "price_above" || selectedType === "price_below";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.background }]}>
        <View>
          <Text style={[styles.title, { color: colors.foreground }]}>Alerts</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {alerts.filter((a) => a.enabled).length} active · {history.length} triggered
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowCreate(true)}
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
        >
          <Feather name="plus" size={18} color={colors.primaryForeground} />
          <Text style={[styles.addBtnText, { color: colors.primaryForeground }]}>New Alert</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.tabRow, { borderBottomColor: colors.border }]}>
        {(["active", "history", "settings"] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setTab(t)}
            style={[styles.tabBtn, tab === t && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          >
            <Text
              style={[styles.tabText, { color: tab === t ? colors.primary : colors.mutedForeground }]}
            >
              {t === "active" ? `Active (${alerts.length})` : t === "history" ? `History (${history.length})` : "Settings"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === "active" && (
        <FlatList
          data={alerts}
          keyExtractor={(a) => a.id}
          renderItem={({ item }) => (
            <AlertRow alert={item} onToggle={toggleAlert} onRemove={removeAlert} />
          )}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 90 }]}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="bell-off" size={40} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No alerts yet</Text>
              <Text style={[styles.emptyHint, { color: colors.mutedForeground }]}>Tap "New Alert" to get started</Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {tab === "history" && (
        <FlatList
          data={history}
          keyExtractor={(h) => h.id}
          renderItem={({ item }) => {
            const isBull = item.type === "price_above" || item.type === "signal_buy";
            return (
              <View style={[styles.histItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.histDot, { backgroundColor: isBull ? colors.bullish : colors.bearish }]} />
                <View style={styles.histContent}>
                  <Text style={[styles.histMsg, { color: colors.foreground }]}>{item.message}</Text>
                  <Text style={[styles.histTime, { color: colors.mutedForeground }]}>{timeAgo(item.timestamp)}</Text>
                </View>
              </View>
            );
          }}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 90 }]}
          ListHeaderComponent={
            history.length > 0 ? (
              <TouchableOpacity onPress={clearHistory} style={styles.clearBtn}>
                <Text style={[styles.clearText, { color: colors.bearish }]}>Clear History</Text>
              </TouchableOpacity>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="clock" size={40} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No triggered alerts</Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {tab === "settings" && (
        <ScrollView
          contentContainerStyle={[styles.settingsList, { paddingBottom: insets.bottom + 90 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.settingsHeader}>
              <Text style={[styles.settingsIcon]}>📱</Text>
              <View>
                <Text style={[styles.settingsTitle, { color: colors.foreground }]}>Telegram Notifications</Text>
                <Text style={[styles.settingsDesc, { color: colors.mutedForeground }]}>
                  Get alerts in your Telegram chat
                </Text>
              </View>
              <Switch
                value={tgActive}
                onValueChange={setTgActive}
                trackColor={{ false: colors.border, true: colors.primary + "80" }}
                thumbColor={tgActive ? colors.primary : colors.mutedForeground}
              />
            </View>

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Bot Token</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.secondary, color: colors.foreground, borderColor: colors.border }]}
              value={tgToken}
              onChangeText={setTgToken}
              placeholder="1234567890:ABCdefGHIjklMNO..."
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry
              autoCapitalize="none"
            />

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Chat ID</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.secondary, color: colors.foreground, borderColor: colors.border }]}
              value={tgChatId}
              onChangeText={setTgChatId}
              placeholder="-100123456789"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="numbers-and-punctuation"
            />

            <Text style={[styles.setupHint, { color: colors.mutedForeground }]}>
              Create a bot via @BotFather on Telegram. Send /start to your bot, then get your Chat ID from @userinfobot.
            </Text>

            <TouchableOpacity
              onPress={handleSaveTelegram}
              style={[styles.saveBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>Save Settings</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      <Modal visible={showCreate} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>Create Alert</Text>
              <TouchableOpacity onPress={() => setShowCreate(false)}>
                <Feather name="x" size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Pair</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
              {TRADING_PAIRS.map((p) => (
                <TouchableOpacity
                  key={p.symbol}
                  onPress={() => setSelectedSymbol(p.symbol)}
                  style={[
                    styles.pill,
                    {
                      backgroundColor: selectedSymbol === p.symbol ? colors.primary : colors.secondary,
                      borderColor: selectedSymbol === p.symbol ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text style={{ color: selectedSymbol === p.symbol ? colors.primaryForeground : colors.foreground, fontSize: 13, fontFamily: "Inter_600SemiBold" }}>
                    {p.base}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Alert Type</Text>
            <View style={styles.typeGrid}>
              {TYPE_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.type}
                  onPress={() => setSelectedType(opt.type)}
                  style={[
                    styles.typeCard,
                    {
                      backgroundColor: selectedType === opt.type ? colors.primary + "20" : colors.secondary,
                      borderColor: selectedType === opt.type ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Feather
                    name={opt.icon as any}
                    size={16}
                    color={selectedType === opt.type ? colors.primary : colors.mutedForeground}
                  />
                  <Text style={[styles.typeLabel, { color: selectedType === opt.type ? colors.primary : colors.foreground }]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {needsPrice && (
              <>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Target Price (USDT)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.secondary, color: colors.foreground, borderColor: colors.border }]}
                  value={targetPrice}
                  onChangeText={setTargetPrice}
                  placeholder="e.g. 75000"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="numeric"
                />
              </>
            )}

            <View style={styles.telegramRow}>
              <Text style={[styles.fieldLabel, { color: colors.foreground, marginBottom: 0 }]}>Send to Telegram</Text>
              <Switch
                value={telegramEnabled}
                onValueChange={setTelegramEnabled}
                trackColor={{ false: colors.border, true: colors.primary + "80" }}
                thumbColor={telegramEnabled ? colors.primary : colors.mutedForeground}
              />
            </View>

            <TouchableOpacity
              onPress={handleCreate}
              style={[styles.createBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.createBtnText, { color: colors.primaryForeground }]}>Create Alert</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  title: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  subtitle: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
  },
  addBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  tabRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    marginBottom: -1,
  },
  tabText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  list: { paddingHorizontal: 16, paddingTop: 4 },
  empty: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 16, fontFamily: "Inter_500Medium" },
  emptyHint: { fontSize: 13, fontFamily: "Inter_400Regular" },
  histItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  histDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  histContent: { flex: 1 },
  histMsg: { fontSize: 13, fontFamily: "Inter_500Medium", lineHeight: 19 },
  histTime: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 4 },
  clearBtn: { alignItems: "flex-end", marginBottom: 8 },
  clearText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  settingsList: { padding: 16 },
  settingsCard: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
  },
  settingsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 18,
  },
  settingsIcon: { fontSize: 24 },
  settingsTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  settingsDesc: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  fieldLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  input: {
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    borderWidth: 1,
    marginBottom: 14,
  },
  setupHint: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
    marginBottom: 16,
  },
  saveBtn: {
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  saveBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  pillScroll: { marginBottom: 18 },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  typeCard: {
    width: "48%",
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  typeLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  telegramRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 4,
  },
  createBtn: {
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
  },
  createBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
