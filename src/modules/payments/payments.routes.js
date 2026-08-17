import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { initializePaymentController, getPaymentController } from "./payments.controller";
const router = Router();
router.post("/initialize", requireAuth, initializePaymentController);
router.get("/:reference", requireAuth, getPaymentController);
export default router;
