import axios from "axios";
import config from "../config/config.js"; // ✅ asegúrate de incluir la extensión .js

const { accessToken, baseUrl } = config.mercadoPago;

export const createPayment = async (req, res) => {
    try {
        const paymentData = {
            transaction_amount: 1000,
            token: req.body.token,
            description: "Suscripción Premium - Vibratto",
            installments: 1,
            payment_method_id: "master",
            payer: {
                email: req.body.email,
                identification: {
                    type: "RUT",
                    number: req.body.rut,
                },
            },
        };

        const response = await axios.post(`${baseUrl}/v1/payments`, paymentData, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        res.status(200).json(response.data);
    } catch (error) {
        console.error("❌ Error al crear el pago:", error.response?.data || error.message);
        res.status(500).json({ error: "Error al procesar el pago" });
    }
};

export const createPreference = async (req, res) => {
    try {
        const preference = {
            items: [
                {
                    title: "Suscripción Premium - Vibratto",
                    description: "Acceso completo a funcionalidades avanzadas",
                    quantity: 1,
                    currency_id: "CLP",
                    unit_price: 1000,
                },
            ],
            payer: {
                email: req.body.email || "TESTUSER230816846@testuser.com",
            },
            redirect_urls: {
                success: "https://www.example.com/success",
                failure: "https://www.example.com/failure",
                pending: "https://www.example.com/pending",
            },
            back_urls: {
                success: "http://localhost:3000/api/pago/success",
                failure: "http://localhost:3000/api/pago/failure",
                pending: "http://localhost:3000/api/pago/pending",
            },
         
            auto_return: "approved",
        };

        const response = await axios.post(
            `${baseUrl}/checkout/preferences`,
            preference,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            }
        );

        res.status(201).json(response.data);
    } catch (error) {
        console.error("❌ Error al crear la preferencia:", error.response?.data || error.message || error);
        res.status(500).json({ error: "Error al crear la preferencia de pago" });
    }

};