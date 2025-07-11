import dotenv from "dotenv";
dotenv.config();

const isProd = process.env.MERCADOPAGO_ENV === "prod";

// 🛠️ Configuración centralizada del proyecto
const config = {
    port: process.env.PORT || 3950,
    mongoURI: process.env.MONGO_URI || "mongodb://localhost:27017/vibratto",
    jwtSecret: process.env.JWT_SECRET || "supersecretoseguro",

    allowedOrigins: process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(",")
        : ["*"],

    // 🔐 Mercado Pago
    mercadoPago: {
        env: process.env.MERCADOPAGO_ENV || "sandbox",
        publicKey: isProd
            ? process.env.MERCADOPAGO_PUBLIC_KEY_PROD
            : process.env.MERCADOPAGO_PUBLIC_KEY_SANDBOX,
        accessToken: isProd
            ? process.env.MERCADOPAGO_ACCESS_TOKEN_PROD
            : process.env.MERCADOPAGO_ACCESS_TOKEN_SANDBOX,
        baseUrl: isProd
            ? "https://api.mercadopago.com"
            : "https://api.mercadopago.com"
    },
};

// 🧪 Verificación de configuración cargada (debug en consola)
console.log("🔍 CONFIGURACIÓN DEL SERVIDOR:");
console.log("🔹 Puerto:", config.port);
console.log("🔹 MongoDB URI:", config.mongoURI ? "OK" : "No encontrada");
console.log("🔹 JWT Secret:", config.jwtSecret ? "OK" : "No encontrada");
console.log("🔹 MP Entorno:", config.mercadoPago.env);
console.log("🔹 MP Public Key:", config.mercadoPago.publicKey ? "OK" : "No encontrada");
console.log("🔹 MP Access Token:", config.mercadoPago.accessToken ? "OK" : "No encontrada");

export default config;
