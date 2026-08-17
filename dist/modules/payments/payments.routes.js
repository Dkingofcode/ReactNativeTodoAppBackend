"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const payments_controller_1 = require("./payments.controller");
const router = (0, express_1.Router)();
router.post("/initialize", auth_middleware_1.requireAuth, payments_controller_1.initializePaymentController);
router.get("/:reference", auth_middleware_1.requireAuth, payments_controller_1.getPaymentController);
exports.default = router;
