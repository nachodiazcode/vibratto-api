import Order from "../models/Order.js";
import Product from "../models/Product.js";
import logger from "../utils/logger.js";

// 🛒 Crear una nueva orden
export const crearOrden = async (req, res) => {
  try {
    const { producto_id, cantidad, metodo_pago } = req.body;
    const userId = req.user.id;

    if (!producto_id || !cantidad || !metodo_pago) {
      return res.status(400).json({ ok: false, mensaje: "Faltan campos obligatorios" });
    }

    const producto = await Product.findById(producto_id);
    if (!producto) {
      logger.warn(`⚠️ Producto [${producto_id}] no encontrado por [${userId}]`);
      return res.status(404).json({ ok: false, mensaje: "Producto no encontrado" });
    }

    if (cantidad <= 0) {
      return res.status(400).json({ ok: false, mensaje: "Cantidad inválida" });
    }

    const total = producto.precio * cantidad;

    const orden = new Order({
      producto: producto._id,
      comprador: userId,
      cantidad,
      total,
      metodo_pago,
    });

    await orden.save();

    logger.info(`🛒 Orden creada por [${userId}] para producto [${producto_id}]`);
    res.status(201).json({ ok: true, mensaje: "Orden creada exitosamente", orden });
  } catch (error) {
    logger.error(`❌ Error en crearOrden por [${req.user.id}]: ${error.message}`);
    res.status(500).json({ ok: false, mensaje: "Error al crear orden", error: error.message });
  }
};

// 📦 Listar todas las órdenes del usuario autenticado
export const listarOrdenes = async (req, res) => {
  try {
    const userId = req.user.id;
    const ordenes = await Order.find({ comprador: userId })
      .sort({ creadoEn: -1 })
      .populate("producto", "nombre precio");

    logger.info(`📦 [${userId}] listó ${ordenes.length} órdenes`);
    res.json({ ok: true, ordenes });
  } catch (error) {
    logger.error(`❌ Error en listarOrdenes para [${req.user.id}]: ${error.message}`);
    res.status(500).json({ ok: false, mensaje: "Error al obtener órdenes", error: error.message });
  }
};

// 🔍 Obtener detalle de una orden
export const obtenerOrden = async (req, res) => {
  try {
    const orden = await Order.findById(req.params.id).populate("producto", "nombre precio");
    if (!orden) {
      logger.warn(`⚠️ Orden [${req.params.id}] no encontrada`);
      return res.status(404).json({ ok: false, mensaje: "Orden no encontrada" });
    }

    if (!orden.comprador.equals(req.user.id)) {
      logger.warn(`🚫 Acceso no autorizado a orden [${req.params.id}] por [${req.user.id}]`);
      return res.status(403).json({ ok: false, mensaje: "No autorizado" });
    }

    logger.info(`📄 Orden [${req.params.id}] consultada por [${req.user.id}]`);
    res.json({ ok: true, orden });
  } catch (error) {
    logger.error(`❌ Error en obtenerOrden [${req.params.id}]: ${error.message}`);
    res.status(500).json({ ok: false, mensaje: "Error al obtener orden", error: error.message });
  }
};

// 🔁 Actualizar estado de la orden (Admin o sistema)
export const actualizarEstadoOrden = async (req, res) => {
  try {
    const { estado } = req.body;
    const orden = await Order.findById(req.params.id);

    if (!orden) {
      logger.warn(`⚠️ Orden [${req.params.id}] no encontrada para actualización`);
      return res.status(404).json({ ok: false, mensaje: "Orden no encontrada" });
    }

    orden.estado = estado;
    await orden.save();

    logger.info(`🔄 Orden [${orden._id}] actualizada a '${estado}' por [${req.user.id}]`);
    res.json({ ok: true, mensaje: "Estado de la orden actualizado", orden });
  } catch (error) {
    logger.error(`❌ Error en actualizarEstadoOrden [${req.params.id}]: ${error.message}`);
    res.status(500).json({ ok: false, mensaje: "Error al actualizar orden", error: error.message });
  }
};
