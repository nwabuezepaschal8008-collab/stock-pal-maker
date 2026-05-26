import { Router, type IRouter } from "express";
import healthRouter from "./health";
import klinesRouter from "./klines";

const router: IRouter = Router();

router.use(healthRouter);
router.use(klinesRouter);

export default router;
