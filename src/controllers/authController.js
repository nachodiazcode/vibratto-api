import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import config from "../config/config.js";

// Función para registrar un nuevo usuario
const register = async (req, res) => {
  try {
    const { nombre, email, password, tipo } = req.body;

    // Verificar si el usuario ya existe
    const existeUsuario = await User.findOne({ email });
    if (existeUsuario) {
      return res.status(400).json({ mensaje: "El usuario ya existe" });
    }

    // Hashear contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Crear usuario
    const nuevoUsuario = new User({
      nombre,
      email,
      password: hashedPassword,
      tipo,
    });

    await nuevoUsuario.save();
    res.status(201).json({ mensaje: "Usuario registrado correctamente" });
  } catch (error) {
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ mensaje: "Faltan campos obligatorios" });
    }

    const usuario = await User.findOne({ email });
    if (!usuario) {
      return res.status(400).json({ mensaje: "Usuario no encontrado" });
    }

    const esCorrecta = await bcrypt.compare(password, usuario.password);
    if (!esCorrecta) {
      return res.status(400).json({ mensaje: "Contraseña incorrecta" });
    }

    // 🔹 Generar Token
    const token = jwt.sign(
      { id: usuario._id, nombre: usuario.nombre, tipo: usuario.tipo },
      config.jwtSecret,
      { expiresIn: "7d" }
    );

    // 🔹 Enviar Token como Cookie Segura
    res.cookie("token", token, {
      httpOnly: true, // No accesible desde JavaScript en frontend
      secure: process.env.NODE_ENV === "production", // Solo en HTTPS en producción
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // Expira en 7 días
    });

    // ✅ **Enviar una única respuesta JSON**
    return res.json({
      mensaje: "Login exitoso",
      token, // 📌 El token ahora se envía correctamente
      usuario
    });

  } catch (error) {
    return res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};


// Función para obtener datos del usuario autenticado
const me = async (req, res) => {
  try {
    const usuario = await User.findById(req.user.id).select("-password");
    if (!usuario) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    res.json(usuario);
  } catch (error) {
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// Función para restablecer contraseña - Enviar email con token (simulado)
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    console.log("📩 Buscando email en la BD:", email); // 🔹 Depuración en consola

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ mensaje: "El usuario no existe" });
    }

    const token = jwt.sign({ id: user._id }, config.jwtSecret, { expiresIn: "1h" });

    user.resetToken = token;
    await user.save();

    console.log("🔹 Token generado:", token);

    res.json({ mensaje: "Token de recuperación generado. Revisa la consola." });
  } catch (error) {
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// Función para cambiar la contraseña con el token de recuperación
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    console.log("📥 Token recibido en reset-password:", token);
    console.log("📥 Nueva contraseña:", newPassword);

    const decoded = jwt.verify(token, config.jwtSecret);
    console.log("✅ Token decodificado:", decoded);

    const usuario = await User.findById(decoded.id);
    if (!usuario) {
      return res.status(400).json({ mensaje: "Token inválido o expirado" });
    }

    console.log("✅ Usuario encontrado:", usuario.email);

    const salt = await bcrypt.genSalt(10);
    usuario.password = await bcrypt.hash(newPassword, salt);

    await usuario.save();
    console.log("🔹 Contraseña actualizada correctamente.");

    res.json({ mensaje: "Contraseña actualizada correctamente" });
  } catch (error) {
    console.log("❌ Error en resetPassword:", error.message);
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};


// Exportar funciones
export { register, login, me, forgotPassword, resetPassword };
