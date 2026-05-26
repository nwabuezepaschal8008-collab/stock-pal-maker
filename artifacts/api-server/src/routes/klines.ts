import { Router, type IRouter } from "express";
import axios from "axios";

const router: IRouter = Router();

const BINANCE_BASE_URL = "https://data-api.binance.vision/api/v3/klines";

router.get("/klines", async (req, res) => {
  const symbol = (req.query["symbol"] as string) || "BTCUSDT";
  const interval = (req.query["interval"] as string) || "1m";

  try {
    const response = await axios.get(BINANCE_BASE_URL, {
      params: { symbol, interval },
    });
    res.json(response.data);
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status ?? 502;
      const message =
        err.response?.data?.msg ?? err.message ?? "Failed to fetch klines";
      res.status(status).json({ error: message });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

export default router;
