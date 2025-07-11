import express from "express";
import cors from "cors";
import morgan from "morgan";
import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import path from "path";
import swaggerJsDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import jwt from "jsonwebtoken";
import chalk from "chalk";

// 🔧 Configs y utilidades
import { connectDB } from "./config/db.js";
import config from "./config/config.js";
import routes from "./routes/index.js";
import blogRoutes from "./routes/blog.js";
import errorHandler from "./middlewares/errorHandler.js";
import logger from "./utils/logger.js";

// 🌍 Inicializar app y server
const app = express();
const server = createServer(app);

// 📡 Configurar Socket.IO
const io = new Server(server, {
  cors: { origin: "*" },
});

// 🔐 Autenticación Socket.IO (JWT)
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("Token no proporcionado"));

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    socket.user = decoded;
    next();
  } catch (err) {
    return next(new Error("Token inválido"));
  }
});

// 📡 Conexión de usuarios
io.on("connection", (socket) => {
  const userId = socket.user?.id;
  logger.success(`✅ Socket conectado: ${socket.id} | Usuario: [${userId}]`);

  socket.join(userId); // Canal privado para ese usuario

  socket.on("mensaje:nuevo", ({ receptorId, contenido }) => {
    const mensaje = {
      remitente: userId,
      receptor: receptorId,
      contenido,
      creadoEn: new Date()
    };

    // Emitir al receptor
    io.to(receptorId).emit("mensaje:recibido", mensaje);

    // Confirmar al emisor
    socket.emit("mensaje:confirmado", mensaje);

    logger.info(`📨 Mensaje de [${userId}] a [${receptorId}]`);
  });

  socket.on("disconnect", () => {
    logger.warn(`❌ Usuario desconectado: ${socket.id}`);
  });
});

// Middleware para usar io desde rutas
app.use((req, res, next) => {
  req.io = io;
  next();
});

// 🧠 Conectar a base de datos
connectDB();

// 🛡 Seguridad y límites
app.use(helmet());
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Demasiadas solicitudes, intenta más tarde."
}));

// 📄 Swagger
const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "Vibratto API",
      description: "Documentación oficial de Vibratto",
      version: "1.0.0"
    }
  },
  apis: ["./routes/*.js"]
};
const swaggerDocs = swaggerJsDoc(swaggerOptions);

// 🔧 Middlewares globales
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: config.allowedOrigins }));
app.use(cookieParser());

// 📂 Rutas
app.use("/api", routes);
app.use("/api/blog", blogRoutes);
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// 📁 Servir archivos estáticos
app.use("/upload-images", express.static(path.join(process.cwd(), "upload-images")));

// Ruta de prueba
app.get("/", (req, res) => {
  res.json({ mensaje: "🎸 Vibratto API está viva y rockeando" });
});

// 🧯 Manejo de errores
app.use(errorHandler);

// 🚀 Iniciar servidor
server.listen(config.port, () => {
  logger.success(`🚀 Servidor corriendo en http://localhost:${config.port}`);
  logger.info(`📚 Documentación en: http://localhost:${config.port}/api/docs`);
});
