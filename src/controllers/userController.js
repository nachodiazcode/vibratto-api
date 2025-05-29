import User from "../models/User.js";

// Obtener perfil de un usuario por ID
const getUserById = async (req, res) => {
  try {
    const usuario = await User.findById(req.params.id).select("-password"); // No mostramos la contraseña
    if (!usuario) return res.status(404).json({ mensaje: "Usuario no encontrado" });

    res.json(usuario);
  } catch (error) {
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// Actualizar perfil de usuario
const updateUser = async (req, res) => {
  try {
    const { nombre, avatar, redes, bio } = req.body;

    // Verificar si el usuario existe
    const usuario = await User.findById(req.params.id);
    if (!usuario) return res.status(404).json({ mensaje: "Usuario no encontrado" });

    // Solo el dueño del perfil puede modificarlo
    if (req.user.id !== usuario.id) {
      return res.status(403).json({ mensaje: "No tienes permiso para modificar este perfil" });
    }

    usuario.nombre = nombre || usuario.nombre;
    usuario.avatar = avatar || usuario.avatar;
    usuario.redes = { ...usuario.redes, ...redes };
    usuario.bio = bio || usuario.bio;

    await usuario.save();

    res.json({ mensaje: "Perfil actualizado correctamente", usuario });
  } catch (error) {
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// Eliminar cuenta de usuario
const deleteUser = async (req, res) => {
  try {
    const usuario = await User.findById(req.params.id);
    if (!usuario) return res.status(404).json({ mensaje: "Usuario no encontrado" });

    // Solo el dueño de la cuenta puede eliminarla
    if (req.user.id !== usuario.id) {
      return res.status(403).json({ mensaje: "No tienes permiso para eliminar esta cuenta" });
    }

    await usuario.deleteOne();
    res.json({ mensaje: "Cuenta eliminada correctamente" });
  } catch (error) {
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// Listar todos los usuarios (opcional)
const getAllUsers = async (req, res) => {
  try {
    const usuarios = await User.find().select("-password"); // No mostrar contraseñas
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// Exportar controladores
export { getUserById, updateUser, deleteUser, getAllUsers };
