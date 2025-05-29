import Product from "../models/Product.js";

// Crear un producto
export const crearProducto = async (req, res) => {
  try {
    const { nombre, descripcion, precio, stock, categoria, imagen, envio_disponible } = req.body;
    const nuevoProducto = new Product({
      nombre,
      descripcion,
      precio,
      stock,
      categoria,
      imagen,
      banda: req.user.id, 
      envio_disponible
    });

    await nuevoProducto.save();
    res.status(201).json({ message: "Producto creado con éxito", producto: nuevoProducto });
  } catch (error) {
    res.status(500).json({ message: "Error al crear el producto", error });
  }
};

// Listar productos
export const listarProductos = async (req, res) => {
  try {
    const productos = await Product.find().populate("banda", "nombre");
    res.json(productos);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener los productos", error });
  }
};

// Obtener un producto
export const obtenerProducto = async (req, res) => {
  try {
    const producto = await Product.findById(req.params.id).populate("banda", "nombre");
    if (!producto) return res.status(404).json({ message: "Producto no encontrado" });

    res.json(producto);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener el producto", error });
  }
};

// Eliminar un producto
export const eliminarProducto = async (req, res) => {
  try {
    const producto = await Product.findById(req.params.id);
    if (!producto) return res.status(404).json({ message: "Producto no encontrado" });

    if (producto.banda.toString() !== req.user.id) {
      return res.status(403).json({ message: "No tienes permiso para eliminar este producto" });
    }

    await producto.deleteOne();
    res.json({ message: "Producto eliminado con éxito" });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar el producto", error });
  }
};
