import Order from "../models/Order.js";
import Product from "../models/Product.js";

// Crear una orden de compra
export const crearOrden = async (req, res) => {
  try {
    const { producto_id, cantidad, metodo_pago } = req.body;

    // Verificar si el producto existe
    const producto = await Product.findById(producto_id);
    if (!producto) return res.status(404).json({ message: "Producto no encontrado" });

    // Calcular el total
    const total = producto.precio * cantidad;

    // Crear la orden
    const nuevaOrden = new Order({
      producto: producto_id,
      comprador: req.user.id, 
      cantidad,
      total,
      metodo_pago
    });

    await nuevaOrden.save();
    res.status(201).json({ message: "Orden creada exitosamente", orden: nuevaOrden });
  } catch (error) {
    res.status(500).json({ message: "Error al crear la orden", error });
  }
};

// Listar órdenes de un usuario
export const listarOrdenes = async (req, res) => {
  try {
    const ordenes = await Order.find({ comprador: req.user.id }).populate("producto", "nombre precio");
    res.json(ordenes);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener las órdenes", error });
  }
};

// Obtener detalles de una orden
export const obtenerOrden = async (req, res) => {
  try {
    const orden = await Order.findById(req.params.id).populate("producto", "nombre precio");
    if (!orden) return res.status(404).json({ message: "Orden no encontrada" });

    res.json(orden);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener la orden", error });
  }
};

// Actualizar el estado de una orden (por ejemplo, de "pendiente" a "pagado")
export const actualizarEstadoOrden = async (req, res) => {
  try {
    const { estado } = req.body;
    const orden = await Order.findById(req.params.id);
    if (!orden) return res.status(404).json({ message: "Orden no encontrada" });

    orden.estado = estado;
    await orden.save();

    res.json({ message: "Estado de la orden actualizado", orden });
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar la orden", error });
  }
};
