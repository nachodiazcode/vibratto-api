import dotenv from "dotenv";

dotenv.config();

const config = {
    port: process.env.PORT || 3950,
    mongoURI: process.env.MONGO_URI || "mongodb://localhost:27017/vibratto",
    jwtSecret: process.env.JWT_SECRET || "supersecretoseguro",
    mercadoPagoAccessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || "",
    mercadoPagoPublicKey: process.env.MERCADOPAGO_PUBLIC_KEY || "",
    allowedOrigins: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",") : ["*"],

     // 🔹 Configuración de Mercado Pago
    mercadoPago: {
        publicKey: process.env.MERCADOPAGO_PUBLIC_KEY,
        accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN
    }
};



// Depuración para verificar que las variables están cargando correctamente
console.log("🔍 CONFIGURACIÓN DEL SERVIDOR:");
console.log("🔹 Puerto:", config.port);
console.log("🔹 MongoDB URI:", config.mongoURI ? "OK" : "No encontrada");
console.log("🔹 JWT Secret:", config.jwtSecret ? "OK" : "No encontrada");
console.log("🔹 Mercado Pago Public Key:", config.mercadoPagoPublicKey ? "OK" : "No encontrada");
console.log("🔹 Mercado Pago Access Token:", config.mercadoPagoAccessToken ? "OK" : "No encontrada");

export default config;

