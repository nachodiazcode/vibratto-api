import express from "express";
import { 
    crearProducto, listarProductos, obtenerProducto, eliminarProducto 
} from "../controllers/productController.js"; // ✅ Correcto

import { 
    crearOrden, listarOrdenes, obtenerOrden, actualizarEstadoOrden 
} from "../controllers/orderController.js"; // ✅ Correcto

import { verificarToken } from "../middlewares/authMiddleware.js"; // ✅ Verifica que authMiddleware.js esté en middlewares/

const router = express.Router();

// 📦 Gestión de productos
router.post("/products", verificarToken, crearProducto);
router.get("/products", listarProductos);
router.get("/products/:id", obtenerProducto);
router.delete("/products/:id", verificarToken, eliminarProducto);

// 🛒 Gestión de órdenes (compras)
router.post("/orders", verificarToken, crearOrden);
router.get("/orders", verificarToken, listarOrdenes);
router.get("/orders/:id", verificarToken, obtenerOrden);
router.put("/orders/:id", verificarToken, actualizarEstadoOrden);

export default router;
