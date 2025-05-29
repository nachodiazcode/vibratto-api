import express from "express";
import { 
  getStreams, getStreamById, createStream, 
  updateStream, deleteStream, searchStreams, 
   createMultipleStreams, toggleFollowStream, toggleLikeStream // ✅ Importamos todas las funciones
} from "../controllers/streamingController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

// 🔹 Endpoint de búsqueda de streams con filtros avanzados
router.get("/search", authMiddleware, searchStreams);  // ✅ Asegurar que `/search` va antes que `/:id`

// 🔹 CRUD de streams
router.get("/", authMiddleware, getStreams);
router.get("/:id", authMiddleware, getStreamById);
router.post("/", authMiddleware, createStream);
router.post("/multiple", authMiddleware, createMultipleStreams); // ✅ Crear múltiples streams
router.put("/:id", authMiddleware, updateStream);
router.delete("/:id", authMiddleware, deleteStream); // ✅ Eliminar un stream por ID

// 🔹 Rutas para manejar likes en streams
router.post("/:id/like", authMiddleware, toggleLikeStream); // ✅ Like/Unlike a streams
router.post("/:id/follow", authMiddleware, toggleFollowStream); // ✅ Nueva ruta
export default router;
