import Product from "../models/Product.js";
import logger from "../utils/logger.js";

// ✅ Crear un producto
export const crearProducto = async (req, res) => {
  try {
    const {
      nombre,
      descripcion,
      precio,
      stock,
      categoria,
      imagen,
      envio_disponible
    } = req.body;

    if (!nombre || !descripcion || !precio || !stock || !categoria) {
      logger.warn(`⚠️ Campos faltantes en creación de producto por banda [${req.user.id}]`);
      return res.status(400).json({ message: "Todos los campos son obligatorios" });
    }

    if (precio <= 0 || stock < 0) {
      return res.status(400).json({ message: "Precio o stock inválidos" });
    }

    const nuevoProducto = new Product({
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      precio,
      stock,
      categoria: categoria.trim(),
      imagen: imagen?.trim() || "",
      banda: req.user.id,
      envio_disponible: !!envio_disponible
    });

    await nuevoProducto.save();
    logger.info(`📦 Producto creado por banda [${req.user.id}] con ID [${nuevoProducto._id}]`);
    res.status(201).json({
      message: "Producto creado con éxito",
      producto: nuevoProducto
    });
  } catch (error) {
    logger.error(`❌ Error al crear producto por banda [${req.user.id}]: ${error.message}`);
    res.status(500).json({ message: "Error al crear el producto", error: error.message });
  }
};

// ✅ Listar productos
export const listarProductos = async (req, res) => {
  try {
    const productos = await Product.find()
      .populate("banda", "nombre")
      .lean();

    logger.info("📄 Productos listados correctamente");
    res.json(productos);
  } catch (error) {
    logger.error(`❌ Error al listar productos: ${error.message}`);
    res.status(500).json({ message: "Error al obtener los productos", error: error.message });
  }
};

// ✅ Obtener un producto
export const obtenerProducto = async (req, res) => {
  try {
    const producto = await Product.findById(req.params.id)
      .populate("banda", "nombre")
      .lean();

    if (!producto) {
      logger.warn(`⚠️ Producto [${req.params.id}] no encontrado`);
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    logger.info(`🔍 Producto [${req.params.id}] recuperado correctamente`);
    res.json(producto);
  } catch (error) {
    logger.error(`❌ Error al obtener producto [${req.params.id}]: ${error.message}`);
    res.status(500).json({ message: "Error al obtener el producto", error: error.message });
  }
};

// ✅ Eliminar un producto
export const eliminarProducto = async (req, res) => {
  try {
    const producto = await Product.findById(req.params.id);
    if (!producto) {
      logger.warn(`⚠️ Producto [${req.params.id}] no encontrado para eliminación por banda [${req.user.id}]`);
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    if (producto.banda.toString() !== req.user.id) {
      logger.warn(`🚫 Intento de eliminación no autorizado del producto [${req.params.id}] por banda [${req.user.id}]`);
      return res.status(403).json({ message: "No tienes permiso para eliminar este producto" });
    }

    await producto.deleteOne();
    logger.info(`🗑️ Producto [${req.params.id}] eliminado por banda [${req.user.id}]`);
    res.json({ message: "Producto eliminado con éxito" });
  } catch (error) {
    logger.error(`❌ Error al eliminar producto [${req.params.id}] por banda [${req.user.id}]: ${error.message}`);
    res.status(500).json({ message: "Error al eliminar el producto", error: error.message });
  }
};
