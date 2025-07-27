import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import config from "../config/config.js";
import logger from "../utils/logger.js";
import { generarToken } from "../utils/generarToken.js";

// 🔐 Registrar un nuevo usuario
export const register = async (req, res) => {
  const { nombre, email, password, tipo } = req.body;
  logger.info(`📥 Intentando registrar usuario: ${email}`);

  try {
    if (!nombre || !email || !password || !tipo) {
      logger.warn(`❌ Registro fallido - Datos incompletos para: ${email}`);
      return res.status(400).json({ ok: false, mensaje: "Todos los campos son obligatorios." });
    }

    const existeUsuario = await User.findOne({ email });
    if (existeUsuario) {
      logger.warn(`⚠️ Registro fallido - Usuario ya existe: ${email}`);
      return res.status(400).json({ ok: false, mensaje: "El usuario ya existe" });
    }

    const hashedPassword = await bcrypt.hash(password, 12); // 🔐 fuerza de hash más segura
    const nuevoUsuario = new User({ nombre, email, password: hashedPassword, tipo });
    await nuevoUsuario.save();

    const token = generarToken(nuevoUsuario);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    logger.info(`✅ Usuario registrado: ${email}`);

    return res.status(201).json({
      ok: true,
      mensaje: "Usuario registrado correctamente",
      usuario: {
        id: nuevoUsuario._id,
        nombre: nuevoUsuario.nombre,
        email: nuevoUsuario.email,
        tipo: nuevoUsuario.tipo,
        creadoEn: nuevoUsuario.createdAt,
      },
      token,
    });
  } catch (error) {
    logger.error(`❌ Error al registrar usuario [${email}]: ${error.message}`);
    return res.status(500).json({ ok: false, mensaje: "Error en el servidor", error: error.message });
  }
};

// 🔓 Iniciar sesión
export const login = async (req, res) => {
  const { email, password } = req.body;
  logger.info(`🔐 Intento de login para: ${email}`);

  try {
    if (!email || !password) {
      logger.warn("⚠️ Login fallido - Faltan campos obligatorios.");
      return res.status(400).json({ ok: false, mensaje: "Faltan campos obligatorios" });
    }

    const usuario = await User.findOne({ email }).select("+password");
    if (!usuario) {
      logger.warn(`❌ Login fallido - Usuario no encontrado: ${email}`);
      return res.status(400).json({ ok: false, mensaje: "Correo o contraseña incorrectos" });
    }

    const passwordValida = await bcrypt.compare(password, usuario.password);
    if (!passwordValida) {
      logger.warn(`❌ Login fallido - Contraseña incorrecta para: ${email}`);
      return res.status(400).json({ ok: false, mensaje: "Correo o contraseña incorrectos" });
    }

    const token = generarToken(usuario);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    logger.info(`✅ Login exitoso: ${email}`);

    return res.status(200).json({
      ok: true,
      mensaje: "Login exitoso",
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        tipo: usuario.tipo,
      },
      token,
    });
  } catch (error) {
    logger.error(`❌ Error durante login de [${email}]: ${error.message}`);
    return res.status(500).json({ ok: false, mensaje: "Error en el servidor", error: error.message });
  }
};

// 👤 Obtener perfil autenticado
export const me = async (req, res) => {
  try {
    const usuario = await User.findById(req.user.id).select("-password");
    if (!usuario) {
      logger.warn(`⚠️ Usuario autenticado no encontrado (ID: ${req.user.id})`);
      return res.status(404).json({ ok: false, mensaje: "Usuario no encontrado" });
    }

    logger.info(`👤 Usuario autenticado: ${usuario.email}`);
    return res.status(200).json({ ok: true, usuario });
  } catch (error) {
    logger.error(`❌ Error al recuperar perfil: ${error.message}`);
    return res.status(500).json({ ok: false, mensaje: "Error en el servidor", error: error.message });
  }
};

// 📩 Solicitud de recuperación
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  logger.info(`📩 Solicitud de recuperación: ${email}`);

  try {
    const user = await User.findOne({ email });
    if (!user) {
      logger.warn(`⚠️ Recuperación fallida - Usuario no encontrado: ${email}`);
      return res.status(400).json({ ok: false, mensaje: "El usuario no existe" });
    }

    const token = jwt.sign({ id: user._id }, config.jwtSecret, { expiresIn: "1h" });
    user.resetToken = token;
    await user.save();

    logger.info(`📧 Token de recuperación generado para: ${email}`);
    // Aquí deberías enviar el correo con el token (enlace para reset)

    return res.json({ ok: true, mensaje: "Token de recuperación enviado. Revisa tu correo." });
  } catch (error) {
    logger.error(`❌ Error en forgotPassword [${email}]: ${error.message}`);
    return res.status(500).json({ ok: false, mensaje: "Error en el servidor", error: error.message });
  }
};

// 🔁 Cambiar contraseña con token
export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  logger.info("🔁 Intento de cambio de contraseña con token.");

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const usuario = await User.findById(decoded.id);
    if (!usuario) {
      logger.warn("❌ Token inválido o usuario no encontrado.");
      return res.status(400).json({ ok: false, mensaje: "Token inválido o expirado" });
    }

    usuario.password = await bcrypt.hash(newPassword, 12);
    usuario.resetToken = undefined;
    await usuario.save();

    logger.info(`✅ Contraseña actualizada para: ${usuario.email}`);
    return res.json({ ok: true, mensaje: "Contraseña actualizada correctamente" });
  } catch (error) {
    logger.error(`❌ Error en resetPassword: ${error.message}`);
    return res.status(500).json({ ok: false, mensaje: "Error en el servidor", error: error.message });
  }
};
