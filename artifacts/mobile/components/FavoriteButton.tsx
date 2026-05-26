import React from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

type Props = {
  active: boolean;
  onToggle: () => void;
  size?: number;
  activeColor?: string;
  inactiveColor?: string;
};

export function FavoriteButton({
  active,
  onToggle,
  size = 18,
  activeColor = "#f59e0b",
  inactiveColor = "#4b5563",
}: Props) {
  function handlePress() {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onToggle();
  }

  return (
    <TouchableOpacity onPress={handlePress} hitSlop={12} style={styles.btn}>
      <Feather
        name="star"
        size={size}
        color={active ? activeColor : inactiveColor}
        style={active ? styles.active : undefined}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: { padding: 4 },
  active: { opacity: 1 },
});
