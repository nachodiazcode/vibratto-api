import express from "express";
import rateLimit from "express-rate-limit";
import { register, login, me, forgotPassword, resetPassword } from "../controllers/authController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import {
  validateRequest,
  registerSchema,
  loginSchema
} from "../middlewares/validateRequest.js";

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Demasiados intentos. Intenta más tarde.",
});

router.post("/register", validateRequest(registerSchema), register);
router.post("/login", authLimiter, validateRequest(loginSchema), login);
router.get("/me", authMiddleware, me);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password", resetPassword);

export default router;
