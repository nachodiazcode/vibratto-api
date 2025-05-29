import jwt from "jsonwebtoken";
import config from "../config/config.js";
import logger from "../utils/logger.js"; // Logger para ver mejor los logs

// Middleware principal para autenticar la solicitud
export const authMiddleware = (req, res, next) => {
  const token = req.header("Authorization");

  if (!token) {
    logger.error("❌ Acceso denegado, no hay token en la solicitud.");
    return res.status(401).json({ mensaje: "Acceso denegado, no hay token" });
  }

  try {
    const tokenSinBearer = token.split(" ")[1];
    const decoded = jwt.verify(tokenSinBearer, config.jwtSecret);

    logger.success(`✅ Token válido para usuario: ${decoded.nombre}`);
    req.user = decoded;
    next();
  } catch (error) {
    logger.error(`❌ Error en autenticación: ${error.message}`);
    res.status(401).json({ mensaje: "Token inválido o expirado" });
  }
};

// Middleware para verificar un token directamente
export const verificarToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Acceso denegado, token no proporcionado" });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Token inválido" });
  }
};

export default authMiddleware;
