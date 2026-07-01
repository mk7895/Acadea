import { Router, type IRouter } from "express";
import healthRouter from "./health";
import contactRouter from "./contact";
import bookingRouter from "./booking";
import googleAuthRouter from "./googleAuth";
import articlesRouter from "./articles";
import adminRouter from "./admin";
import platformRouter from "./platform";
import mediaRouter from "./media";

const router: IRouter = Router();

router.use(healthRouter);
router.use(contactRouter);
router.use("/booking", bookingRouter);
router.use(googleAuthRouter);
router.use(articlesRouter);
router.use(adminRouter);
router.use(platformRouter);
router.use(mediaRouter);

export default router;
