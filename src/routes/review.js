import express from "express";
import { getUserReviews, createReview, deleteReview } from "../controllers/reviewController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/:userId", getUserReviews); // Obtener reseñas de un usuario
router.post("/", authMiddleware, createReview); // Crear una reseña (protegido)
router.delete("/:id", authMiddleware, deleteReview); // Eliminar una reseña (protegido)
router.put("/recommendations/:id", authMiddleware, editSavedRecommendation);

export default router;
