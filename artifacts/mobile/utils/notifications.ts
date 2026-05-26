import * as Notifications from "expo-notifications";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === "web") return true;
  const result = await Notifications.requestPermissionsAsync();
  return (result as any).granted ?? (result as any).status === "granted";
}

export async function sendLocalNotification(
  title: string,
  body: string,
): Promise<void> {
  if (Platform.OS !== "web") {
    try {
      await Notifications.scheduleNotificationAsync({
        content: { title, body, sound: true },
        trigger: null,
      });
    } catch {}
  }
}

export async function triggerAlertHaptic(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch {}
}

export async function sendTelegramMessage(
  botToken: string,
  chatId: string,
  text: string,
): Promise<void> {
  if (!botToken || !chatId) return;
  try {
    await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
      },
    );
  } catch {}
}
