import  express from "express";
import * as dotenv from "dotenv";
import { requireAuth, AuthenticatedRequest } from "./middlewares/auth.middleware";
import { pool } from "./db/pool";
import usersRoutes from "./modules/users/users.routes";
import authRoutes from "./modules/auth/auth.routes";
import todoRoutes from "./modules/todos/todos.routes";
import paymentRoutes from "./modules/payments/payments.routes";
import { paystackWebhookController } from "./modules/payments/payments.controller";

dotenv.config();

const app = express();

// WEBHOOK MUST COME BEFORE express.json()
app.post(
  "/payments/webhook",
  express.raw({ type: "application/json" }),
  paystackWebhookController
);



app.use(express.json());

const PORT = process.env.PORT || 3000;

interface RootResponse {
    message: string;
}

app.get(
    "/",
    ( res: import("express").Response<RootResponse>) => {
        res.json({
            message: "Todo API is running",
        });
    }
);

app.get("/health", async ( res: import("express").Response) => {
  try {
    const result = await pool.query("SELECT NOW()");

    res.json({
      status: "ok",
      database: "connected",
      time: result.rows[0].now,
    });
  } catch (error) {
    console.error("Database connection failed:", error);

    res.status(500).json({
      status: "error",
      database: "disconnected",
    });
  }
});

app.get(
  "/auth/me",
  requireAuth,
  (req: AuthenticatedRequest, res) => {
    res.json({
      message: "You are authenticated.",
      user: req.user,
    });
  }
);



app.use("/users", usersRoutes);
app.use("/auth", authRoutes);
app.use("/todos", requireAuth, todoRoutes);
app.use("/payments", requireAuth, paymentRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});