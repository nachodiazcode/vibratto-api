import express from "express";
import cors from "cors";
import morgan from "morgan";
import { createServer } from "http";
import { Server } from "socket.io"; // ✅ Importar Socket.io
import dotenv from "dotenv";
import mercadopago from "mercadopago";
import { connectDB } from "./config/db.js";
import config from "./config/config.js";
import routes from "./routes/index.js";
import errorHandler from "./middlewares/errorHandler.js";
import logger from "./utils/logger.js";
import chalk from "chalk";
import cookieParser from "cookie-parser";
import path from "path";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import swaggerJsDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import blogRoutes from "./routes/blog.js"; // Asegúrate de la ruta correcta

// 🌟 **Inicializar Express**
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }, // Permitir conexiones desde cualquier origen
});

// 📡 **Escuchar eventos de conexión de usuarios**
io.on("connection", (socket) => {
  console.log("🔌 Usuario conectado:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ Usuario desconectado");
  });
});

// 📢 **Middleware para permitir el uso de `io` en rutas**
app.use((req, res, next) => {
  req.io = io;
  next();
});

// 🛡 **Configurar seguridad con Helmet**
app.use(helmet());

// 🚦 **Configurar Rate Limiting**
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde."
});
app.use(limiter);

// 📝 **Configurar Swagger para documentación**
const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: { title: "Vibratto API", description: "Documentación API", version: "1.0.0" }
  },
  apis: ["./routes/*.js"]
};
const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// 🔹 **Cargar Middlewares**
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: config.allowedOrigins }));
app.use(cookieParser());

// 🔹 **Cargar Rutas**
app.use("/api", routes);
app.use("/api/blog", blogRoutes);

// 📀 Servir imágenes de la carpeta upload-images
app.use("/upload-images", express.static(path.join(process.cwd(), "upload-images")));

// ✅ Ruta de prueba
app.get("/", (req, res) => {
  res.json({ mensaje: "API de Vibratto funcionando 🎸🔥" });
});

// Middleware de errores
app.use(errorHandler);

// 🚀 **Iniciar Servidor**
server.listen(config.port, () => {
  logger.success(`🚀 Servidor corriendo en http://localhost:${config.port}`);
  logger.info(`📝 Documentación en: http://localhost:${config.port}/api/docs`);
});
