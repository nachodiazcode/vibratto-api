import User from "../models/User.js";
import logger from "../utils/logger.js";

// 🔹 Obtener perfil de un usuario por ID
const getUserById = async (req, res) => {
  try {
    const usuario = await User.findById(req.params.id).select("-password");
    if (!usuario) {
      logger.warn(`⚠️ Usuario no encontrado: [${req.params.id}] solicitado por [${req.user.id}]`);
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    logger.info(`👤 Perfil obtenido de [${usuario._id}] por [${req.user.id}]`);
    res.json(usuario);
  } catch (error) {
    logger.error(`❌ Error al obtener usuario [${req.user.id}]: ${error.message}`);
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// 🔹 Actualizar perfil del usuario autenticado
const updateUser = async (req, res) => {
  try {
    const { nombre, avatar, redes = {}, bio } = req.body;

    const usuario = await User.findById(req.params.id);
    if (!usuario) {
      logger.warn(`⚠️ Intento de actualizar usuario inexistente [${req.params.id}]`);
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    if (usuario._id.toString() !== req.user.id) {
      logger.warn(`⛔ Acceso denegado: [${req.user.id}] intentó modificar [${usuario._id}]`);
      return res.status(403).json({ mensaje: "No tienes permiso para modificar este perfil" });
    }

    // Aplicar cambios si existen
    if (nombre !== undefined) usuario.nombre = nombre;
    if (avatar !== undefined) usuario.avatar = avatar;
    if (bio !== undefined) usuario.bio = bio;
    if (typeof redes === "object") {
      usuario.redes = { ...usuario.redes, ...redes };
    }

    await usuario.save();
    logger.info(`✏️ Perfil actualizado correctamente [${usuario._id}]`);
    res.json({ mensaje: "Perfil actualizado correctamente", usuario });
  } catch (error) {
    logger.error(`❌ Error al actualizar perfil [${req.user.id}]: ${error.message}`);
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// 🔹 Eliminar cuenta del usuario autenticado
const deleteUser = async (req, res) => {
  try {
    const usuario = await User.findById(req.params.id);
    if (!usuario) {
      logger.warn(`⚠️ Intento de eliminar usuario inexistente [${req.params.id}]`);
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    if (usuario._id.toString() !== req.user.id) {
      logger.warn(`⛔ Acceso denegado: [${req.user.id}] intentó eliminar [${usuario._id}]`);
      return res.status(403).json({ mensaje: "No tienes permiso para eliminar esta cuenta" });
    }

    await usuario.deleteOne();
    logger.info(`🗑️ Usuario eliminado [${usuario._id}]`);
    res.json({ mensaje: "Cuenta eliminada correctamente" });
  } catch (error) {
    logger.error(`❌ Error al eliminar usuario [${req.user.id}]: ${error.message}`);
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// 🔹 Listar todos los usuarios (uso administrativo)
const getAllUsers = async (req, res) => {
  try {
    const usuarios = await User.find().select("-password");
    logger.info(`📋 ${usuarios.length} usuarios listados por [${req.user.id}]`);
    res.json(usuarios);
  } catch (error) {
    logger.error(`❌ Error al listar usuarios [${req.user.id}]: ${error.message}`);
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// 🔹 Exports
export {
  getUserById,
  updateUser,
  deleteUser,
  getAllUsers
};
