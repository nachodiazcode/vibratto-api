import express from "express";
import { checkPremiumStatus, purchasePremium, cancelPremium } from "../controllers/premiumController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/status", authMiddleware, checkPremiumStatus); // Verificar si el usuario es premium
router.post("/purchase", authMiddleware, purchasePremium); // Comprar un plan premium
router.put("/cancel", authMiddleware, cancelPremium); // Cancelar la suscripción

export default router;
