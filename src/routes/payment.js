import express from "express";
import { createPreference, createPayment } from "../controllers/paymentController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

// 🧾 Checkout Básico (Preferencia)
router.post("/create-preference", authMiddleware, createPreference);

// 💳 Pago directo con tarjeta (tokenizada)
router.post("/create-payment", authMiddleware, createPayment);

export default router;
