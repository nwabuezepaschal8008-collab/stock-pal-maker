import React, { useMemo } from "react";
import { View, Platform, StyleSheet } from "react-native";

type Props = {
  symbol: string;
  interval?: string;
  height?: number;
};

const TV_INTERVAL_MAP: Record<string, string> = {
  "1m": "1",
  "5m": "5",
  "15m": "15",
  "1h": "60",
  "4h": "240",
  "1d": "D",
};

function tvSymbol(symbol: string) {
  return `BINANCE:${symbol}`;
}

export function TradingViewChart({ symbol, interval = "1h", height = 420 }: Props) {
  const tvInterval = TV_INTERVAL_MAP[interval] ?? "60";
  const sym = tvSymbol(symbol);

  const html = useMemo(
    () => `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    html,body{width:100%;height:100%;background:#0d1117;overflow:hidden}
    .tv{width:100%;height:100%}
  </style>
</head>
<body>
  <div class="tradingview-widget-container tv">
    <div class="tradingview-widget-container__widget tv"></div>
    <script type="text/javascript" src="https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js">
    {
      "autosize":true,
      "symbol":"${sym}",
      "interval":"${tvInterval}",
      "timezone":"Etc/UTC",
      "theme":"dark",
      "style":"1",
      "locale":"en",
      "backgroundColor":"rgba(13,17,23,1)",
      "gridColor":"rgba(33,38,45,0.8)",
      "hide_top_toolbar":false,
      "hide_legend":false,
      "range":"3M",
      "allow_symbol_change":false,
      "save_image":false,
      "studies":["RSI@tv-basicstudies","MACD@tv-basicstudies"]
    }
    </script>
  </div>
</body>
</html>`,
    [sym, tvInterval],
  );

  if (Platform.OS === "web") {
    const src = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
    return (
      <View style={[styles.wrapper, { height }]}>
        <iframe
          src={src}
          style={{ width: "100%", height: "100%", border: "none", borderRadius: 16 }}
          sandbox="allow-scripts allow-same-origin allow-popups"
          title="TradingView Chart"
        />
      </View>
    );
  }

  const WebView = require("react-native-webview").WebView;
  return (
    <View style={[styles.wrapper, { height }]}>
      <WebView
        source={{ html }}
        style={styles.webview}
        scrollEnabled={false}
        bounces={false}
        originWhitelist={["*"]}
        javaScriptEnabled
        domStorageEnabled
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 16,
    overflow: "hidden",
    marginHorizontal: 16,
    marginBottom: 12,
  },
  webview: {
    flex: 1,
    backgroundColor: "#0d1117",
  },
});
