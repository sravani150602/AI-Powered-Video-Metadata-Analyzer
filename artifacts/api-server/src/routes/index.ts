import { Router, type IRouter } from "express";
import healthRouter from "./health";
import videosRouter from "./videos";
import analyzeRouter from "./analyze";
import analyticsRouter from "./analytics";

const router: IRouter = Router();

router.use(healthRouter);
router.use(videosRouter);
router.use(analyzeRouter);
router.use(analyticsRouter);

export default router;
