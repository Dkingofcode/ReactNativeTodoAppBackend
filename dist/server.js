"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv = __importStar(require("dotenv"));
const auth_middleware_1 = require("./middlewares/auth.middleware");
const pool_1 = require("./db/pool");
const users_routes_1 = __importDefault(require("./modules/users/users.routes"));
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const todos_routes_1 = __importDefault(require("./modules/todos/todos.routes"));
const payments_routes_1 = __importDefault(require("./modules/payments/payments.routes"));
const payments_controller_1 = require("./modules/payments/payments.controller");
dotenv.config();
const app = (0, express_1.default)();
app.post("/payments/webhook", express_1.default.raw({ type: "application/json" }), payments_controller_1.paystackWebhookController);
app.use(express_1.default.json());
const PORT = process.env.PORT || 3000;
app.get("/", (res) => {
    res.json({
        message: "Todo API is running",
    });
});
app.get("/health", async (res) => {
    try {
        const result = await pool_1.pool.query("SELECT NOW()");
        res.json({
            status: "ok",
            database: "connected",
            time: result.rows[0].now,
        });
    }
    catch (error) {
        console.error("Database connection failed:", error);
        res.status(500).json({
            status: "error",
            database: "disconnected",
        });
    }
});
app.get("/auth/me", auth_middleware_1.requireAuth, (req, res) => {
    res.json({
        message: "You are authenticated.",
        user: req.user,
    });
});
app.use("/users", users_routes_1.default);
app.use("/auth", auth_routes_1.default);
app.use("/todos", auth_middleware_1.requireAuth, todos_routes_1.default);
app.use("/payments", auth_middleware_1.requireAuth, payments_routes_1.default);
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
