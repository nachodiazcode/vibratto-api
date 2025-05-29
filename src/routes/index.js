import express from "express";

// 🔹 Importamos todas las rutas de la API
import authRoutes from "./auth.js";
import userRoutes from "./user.js";
import eventRoutes from "./events.js";
import chatRoutes from "./chat.js";
import notificationRoutes from "./notification.js";
import recommendationRoutes from "./recommendation.js";
import streamingRoutes from "./streaming.js";
import collabRoutes from "./collab.js";
import premiumRoutes from "./premium.js";
import blogRoutes from "./blog.js";
import merchRoutes from "./merch.js"; // ✅ Se mantiene dentro del mismo código
import bandRoutes from "./bands.js";  // ✅ Nueva ruta de bandas

const router = express.Router();

// 🔹 Definición de rutas principales
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/events", eventRoutes);
router.use("/chat", chatRoutes);
router.use("/notifications", notificationRoutes);
router.use("/recommendations", recommendationRoutes);
router.use("/streams", streamingRoutes);
router.use("/collabs", collabRoutes);
router.use("/premium", premiumRoutes);
router.use("/blog", blogRoutes);
router.use("/merch", merchRoutes); // 📦 Merchandising integrado correctamente
router.use("/bands", bandRoutes); // ✅ Ahora podemos registrar y ver bandas

export default router;
