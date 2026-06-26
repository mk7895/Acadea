import { Router, type IRouter } from "express";
import healthRouter from "./health";
import contactRouter from "./contact";
import bookingRouter from "./booking";
import googleAuthRouter from "./googleAuth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(contactRouter);
router.use("/booking", bookingRouter);
router.use(googleAuthRouter);

export default router;
