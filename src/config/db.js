import mongoose from "mongoose";
import logger from "../utils/logger.js";
import config from "./config.js"; 

export async function connectDB() {
    try {
        if (!config.mongoURI) {
            throw new Error("⚠️ ERROR: `MONGO_URI` no está definido en config.js o .env");
        }

        await mongoose.connect(config.mongoURI, {
            serverSelectionTimeoutMS: 5000, // Espera hasta 5 segundos para conectarse
            socketTimeoutMS: 45000, // Cierra la conexión si no responde en 45 segundos
            autoIndex: true, // Habilitar creación automática de índices
            maxPoolSize: 10, // Máximo de conexiones simultáneas
        });

        logger.info("✅ Conectado a MongoDB correctamente");
    } catch (error) {
        logger.error(`❌ Error conectando a MongoDB: ${error.message}`);
        process.exit(1);
    }
}
