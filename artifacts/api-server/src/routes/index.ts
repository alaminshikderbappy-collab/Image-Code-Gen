import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import scansRouter from "./scans";
import hairstylesRouter from "./hairstyles";
import barbersRouter from "./barbers";

const router: IRouter = Router();

router.use(healthRouter);
router.use(usersRouter);
router.use(scansRouter);
router.use(hairstylesRouter);
router.use(barbersRouter);

export default router;
