// src/config/mercadopago.js
import { MercadoPagoConfig } from 'mercadopago';

const ENV = process.env.MERCADOPAGO_ENV || 'sandbox';

const accessToken = ENV === 'prod'
    ? process.env.MERCADOPAGO_ACCESS_TOKEN_PROD
    : process.env.MERCADOPAGO_ACCESS_TOKEN_SANDBOX;

if (!accessToken) {
    console.error('[❌ ERROR] Mercado Pago access token no definido en .env');
    process.exit(1);
}

const mercadopago = new MercadoPagoConfig({
    accessToken,
    options: { timeout: 5000 } // opcional
});

console.log(`🟢 MP configurado en entorno ${ENV}`);
console.log(`🔐 Token usado: ${accessToken.slice(0, 12)}...`);

export default mercadopago;
