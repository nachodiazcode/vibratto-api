import jwt from "jsonwebtoken";
import config from "../config/config.js";

export const generarToken = (usuario) => {
  return jwt.sign(
    { id: usuario._id, nombre: usuario.nombre, tipo: usuario.tipo },
    config.jwtSecret,
    { expiresIn: "7d" }
  );
};
