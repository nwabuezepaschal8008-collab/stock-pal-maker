import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Path, Line, Text as SvgText, Defs, LinearGradient, Stop } from "react-native-svg";
import { type Kline } from "../hooks/useKlines";
import { useColors } from "@/hooks/useColors";

type Props = {
  klines: Kline[];
  width: number;
  height?: number;
};

export function PriceChart({ klines, width, height = 200 }: Props) {
  const colors = useColors();

  const { linePath, areaPath, yLabels, xLabels } = useMemo(() => {
    if (klines.length < 2) return { linePath: "", areaPath: "", yLabels: [], xLabels: [] };

    const padLeft = 56;
    const padRight = 8;
    const padTop = 12;
    const padBottom = 28;
    const w = width - padLeft - padRight;
    const h = height - padTop - padBottom;

    const prices = klines.map((k) => k.close);
    const minP = Math.min(...prices);
    const maxP = Math.max(...prices);
    const range = maxP - minP || 1;

    const toX = (i: number) => padLeft + (i / (klines.length - 1)) * w;
    const toY = (p: number) => padTop + h - ((p - minP) / range) * h;

    const pts = prices.map((p, i) => `${toX(i).toFixed(1)},${toY(p).toFixed(1)}`);
    const linePath = `M${pts.join(" L")}`;
    const areaPath = `${linePath} L${toX(klines.length - 1).toFixed(1)},${(padTop + h).toFixed(1)} L${padLeft},${(padTop + h).toFixed(1)} Z`;

    const yLabels = [0, 0.25, 0.5, 0.75, 1].map((t) => {
      const price = minP + range * t;
      return {
        y: toY(price),
        label: price >= 1000 ? `${(price / 1000).toFixed(1)}k` : price.toFixed(2),
      };
    });

    const step = Math.max(1, Math.floor(klines.length / 4));
    const xLabels = klines
      .filter((_, i) => i % step === 0 || i === klines.length - 1)
      .map((k, _, arr) => {
        const idx = klines.indexOf(k);
        const d = new Date(k.openTime);
        const label =
          arr.length > 3
            ? `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`
            : `${d.getMonth() + 1}/${d.getDate()}`;
        return { x: toX(idx), label };
      });

    return { linePath, areaPath, yLabels, xLabels };
  }, [klines, width, height]);

  const isUp =
    klines.length >= 2
      ? (klines[klines.length - 1]?.close ?? 0) >= (klines[0]?.close ?? 0)
      : true;
  const strokeColor = isUp ? "#00C896" : "#FF4757";

  if (!linePath) {
    return (
      <View style={[styles.empty, { height }]}>
        <Text style={{ color: colors.mutedForeground }}>No data</Text>
      </View>
    );
  }

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={strokeColor} stopOpacity={0.25} />
          <Stop offset="1" stopColor={strokeColor} stopOpacity={0} />
        </LinearGradient>
      </Defs>

      {yLabels.map(({ y, label }, i) => (
        <React.Fragment key={i}>
          <Line x1={56} y1={y} x2={width - 8} y2={y} stroke="#21262D" strokeWidth={1} />
          <SvgText x={4} y={y + 4} fontSize={9} fill="#8B949E" textAnchor="start">
            {label}
          </SvgText>
        </React.Fragment>
      ))}

      {xLabels.map(({ x, label }, i) => (
        <SvgText key={i} x={x} y={height - 6} fontSize={9} fill="#8B949E" textAnchor="middle">
          {label}
        </SvgText>
      ))}

      <Path d={areaPath} fill="url(#area-grad)" />
      <Path d={linePath} stroke={strokeColor} strokeWidth={2} fill="none" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  empty: {
    alignItems: "center",
    justifyContent: "center",
  },
});
