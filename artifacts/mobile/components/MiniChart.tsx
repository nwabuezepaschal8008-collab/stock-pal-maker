import React, { useMemo } from "react";
import { View } from "react-native";
import Svg, { Path, Defs, LinearGradient, Stop } from "react-native-svg";

type Props = {
  prices: number[];
  width?: number;
  height?: number;
  bullish: boolean;
};

export function MiniChart({ prices, width = 80, height = 36, bullish }: Props) {
  const path = useMemo(() => {
    if (prices.length < 2) return "";
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;
    const pad = 2;
    const w = width - pad * 2;
    const h = height - pad * 2;
    const points = prices.map((p, i) => {
      const x = pad + (i / (prices.length - 1)) * w;
      const y = pad + h - ((p - min) / range) * h;
      return `${x},${y}`;
    });
    return `M${points.join(" L")}`;
  }, [prices, width, height]);

  const color = bullish ? "#00C896" : "#FF4757";
  const id = `grad-${bullish ? "bull" : "bear"}`;

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={color} stopOpacity={0.3} />
            <Stop offset="1" stopColor={color} stopOpacity={1} />
          </LinearGradient>
        </Defs>
        {path ? (
          <Path d={path} stroke={`url(#${id})`} strokeWidth={2} fill="none" />
        ) : null}
      </Svg>
    </View>
  );
}
