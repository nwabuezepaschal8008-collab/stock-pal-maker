import { useState, useEffect, useCallback, useRef } from "react";
import { storageGet, storageSet } from "../utils/storage";
import {
  sendLocalNotification,
  triggerAlertHaptic,
  sendTelegramMessage,
} from "../utils/notifications";

export type AlertType = "price_above" | "price_below" | "signal_buy" | "signal_sell";

export type PriceAlert = {
  id: string;
  symbol: string;
  type: AlertType;
  targetPrice?: number;
  enabled: boolean;
  createdAt: number;
  triggeredAt?: number;
  triggerCount: number;
  telegramEnabled: boolean;
};

export type AlertHistoryEntry = {
  id: string;
  alertId: string;
  symbol: string;
  type: AlertType;
  message: string;
  price: number;
  timestamp: number;
};

export type TelegramConfig = {
  botToken: string;
  chatId: string;
  enabled: boolean;
};

const ALERTS_KEY = "price_alerts_v1";
const HISTORY_KEY = "alert_history_v1";
const TELEGRAM_KEY = "telegram_config_v1";

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function alertLabel(type: AlertType): string {
  switch (type) {
    case "price_above": return "Price Above Target";
    case "price_below": return "Price Below Target";
    case "signal_buy": return "BUY Signal";
    case "signal_sell": return "SELL Signal";
  }
}

export function useAlerts() {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [history, setHistory] = useState<AlertHistoryEntry[]>([]);
  const [telegram, setTelegramState] = useState<TelegramConfig>({
    botToken: "",
    chatId: "",
    enabled: false,
  });
  const triggeredRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    Promise.all([
      storageGet<PriceAlert[]>(ALERTS_KEY),
      storageGet<AlertHistoryEntry[]>(HISTORY_KEY),
      storageGet<TelegramConfig>(TELEGRAM_KEY),
    ]).then(([a, h, t]) => {
      if (a) setAlerts(a);
      if (h) setHistory(h);
      if (t) setTelegramState(t);
    });
  }, []);

  const addAlert = useCallback(
    async (params: Omit<PriceAlert, "id" | "createdAt" | "triggerCount">) => {
      const alert: PriceAlert = {
        ...params,
        id: genId(),
        createdAt: Date.now(),
        triggerCount: 0,
      };
      setAlerts((prev) => {
        const next = [alert, ...prev];
        storageSet(ALERTS_KEY, next);
        return next;
      });
    },
    [],
  );

  const removeAlert = useCallback(async (id: string) => {
    setAlerts((prev) => {
      const next = prev.filter((a) => a.id !== id);
      storageSet(ALERTS_KEY, next);
      return next;
    });
  }, []);

  const toggleAlert = useCallback(async (id: string) => {
    setAlerts((prev) => {
      const next = prev.map((a) =>
        a.id === id ? { ...a, enabled: !a.enabled } : a,
      );
      storageSet(ALERTS_KEY, next);
      return next;
    });
  }, []);

  const saveTelegram = useCallback(async (config: TelegramConfig) => {
    setTelegramState(config);
    await storageSet(TELEGRAM_KEY, config);
  }, []);

  const checkAlerts = useCallback(
    async (
      symbol: string,
      currentPrice: number,
      prevPrice: number,
      currentSignal?: string,
    ) => {
      const activeAlerts = alerts.filter(
        (a) => a.enabled && a.symbol === symbol,
      );

      for (const alert of activeAlerts) {
        const sessionKey = `${alert.id}:${Math.floor(Date.now() / 60_000)}`;
        if (triggeredRef.current.has(sessionKey)) continue;

        let shouldTrigger = false;
        let message = "";

        if (
          alert.type === "price_above" &&
          alert.targetPrice !== undefined &&
          currentPrice >= alert.targetPrice &&
          prevPrice < alert.targetPrice
        ) {
          shouldTrigger = true;
          message = `🚀 ${symbol.replace("USDT", "")} crossed above $${alert.targetPrice.toLocaleString()} — now $${currentPrice.toLocaleString()}`;
        } else if (
          alert.type === "price_below" &&
          alert.targetPrice !== undefined &&
          currentPrice <= alert.targetPrice &&
          prevPrice > alert.targetPrice
        ) {
          shouldTrigger = true;
          message = `📉 ${symbol.replace("USDT", "")} dropped below $${alert.targetPrice.toLocaleString()} — now $${currentPrice.toLocaleString()}`;
        } else if (
          alert.type === "signal_buy" &&
          currentSignal === "BUY"
        ) {
          shouldTrigger = true;
          message = `📈 BUY signal for ${symbol.replace("USDT", "")} at $${currentPrice.toLocaleString()}`;
        } else if (
          alert.type === "signal_sell" &&
          currentSignal === "SELL"
        ) {
          shouldTrigger = true;
          message = `📉 SELL signal for ${symbol.replace("USDT", "")} at $${currentPrice.toLocaleString()}`;
        }

        if (shouldTrigger) {
          triggeredRef.current.add(sessionKey);

          await triggerAlertHaptic();
          await sendLocalNotification(alertLabel(alert.type), message);

          if (telegram.enabled && alert.telegramEnabled) {
            await sendTelegramMessage(
              telegram.botToken,
              telegram.chatId,
              `<b>${alertLabel(alert.type)}</b>\n${message}`,
            );
          }

          const entry: AlertHistoryEntry = {
            id: genId(),
            alertId: alert.id,
            symbol,
            type: alert.type,
            message,
            price: currentPrice,
            timestamp: Date.now(),
          };

          setHistory((prev) => {
            const next = [entry, ...prev].slice(0, 100);
            storageSet(HISTORY_KEY, next);
            return next;
          });

          setAlerts((prev) => {
            const next = prev.map((a) =>
              a.id === alert.id
                ? {
                    ...a,
                    triggerCount: a.triggerCount + 1,
                    triggeredAt: Date.now(),
                  }
                : a,
            );
            storageSet(ALERTS_KEY, next);
            return next;
          });
        }
      }
    },
    [alerts, telegram],
  );

  const clearHistory = useCallback(async () => {
    setHistory([]);
    await storageSet(HISTORY_KEY, []);
  }, []);

  return {
    alerts,
    history,
    telegram,
    addAlert,
    removeAlert,
    toggleAlert,
    checkAlerts,
    saveTelegram,
    clearHistory,
  };
}
