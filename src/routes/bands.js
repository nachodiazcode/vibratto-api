import express from "express";
import { registrarBanda, obtenerBandas, obtenerBandaPorId } from "../controllers/bandController.js";
import { verificarToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/register", verificarToken, registrarBanda);  // ✅ Inscribir una banda
router.get("/", obtenerBandas);  // ✅ Listar todas las bandas
router.get("/:id", obtenerBandaPorId);  // ✅ Ver perfil de una banda

export default router;
