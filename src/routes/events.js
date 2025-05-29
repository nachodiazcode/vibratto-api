import express from "express";
import { 
  getRecommendations, 
  saveRecommendation, 
  getSavedRecommendations, 
  deleteSavedRecommendation
} from "../controllers/recommendationController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

// 🔹 **Endpoint de búsqueda de recomendaciones**
router.get("/search", authMiddleware, getRecommendations); // ✅ Asegurar que `/search` va antes que `/:id`

// 🔹 **CRUD de recomendaciones**
router.get("/", authMiddleware, getRecommendations);
router.get("/saved", authMiddleware, getSavedRecommendations);
router.post("/save", authMiddleware, saveRecommendation);
router.delete("/saved/:id", authMiddleware, deleteSavedRecommendation); // ✅ Eliminar una recomendación guardada

export default router;
