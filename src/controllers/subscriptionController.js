import { PreApproval, PreApprovalPlan } from 'mercadopago';
import mercadopago from '../config/mercadopago.js';

// 🔹 Crear plan de suscripción recurrente
export const crearPlan = async (req, res) => {
    try {
        const {
            reason = 'Membresía Vibratto mensual',
            transaction_amount = 1500,
            currency_id = 'CLP',
            frequency = 1,
            frequency_type = 'months',
            repetitions = 12,
            billing_day = 5,
            free_trial_frequency = 1,
            free_trial_type = 'months',
            back_url = 'https://vibratto.com/thanks'
        } = req.body || {};

        if (transaction_amount < 599) {
            return res.status(400).json({
                error: 'El monto mínimo permitido para planes es de $599 CLP'
            });
        }

        const planAPI = new PreApprovalPlan(mercadopago);
        const response = await planAPI.create({
            body: {
                reason,
                auto_recurring: {
                    frequency,
                    frequency_type,
                    transaction_amount,
                    currency_id,
                    repetitions,
                    billing_day,
                    billing_day_proportional: true,
                    free_trial: {
                        frequency: free_trial_frequency,
                        frequency_type: free_trial_type
                    }
                },
                back_url
            }
        });

        console.log('✅ Plan creado con éxito:', response.id);

        res.status(201).json({
            message: '✅ Plan creado correctamente',
            plan_id: response.id,
            response
        });
    } catch (err) {
        console.error('❌ Error al crear plan:', err.message || err);
        res.status(500).json({ error: 'Error al crear plan', detail: err.message });
    }
};

// 🔹 Crear suscripción
export const crearSuscripcion = async (req, res) => {
    try {
        const {
            plan_id,
            payer_email,
            card_token_id,
            external_reference
        } = req.body;

        const subscriptionAPI = new PreApproval(mercadopago);
        const response = await subscriptionAPI.create({
            body: {
                preapproval_plan_id: plan_id,
                card_token_id,
                payer_email,
                external_reference,
                reason: 'Membresía Vibratto mensual',
                auto_recurring: {
                    frequency: 1,
                    frequency_type: 'months'
                },
                back_url: 'https://vibratto.com/subscription/thanks',
                status: 'authorized'
            }
        });

        console.log('✅ Suscripción creada:', response.id);

        res.status(201).json({
            message: '✅ Suscripción creada correctamente',
            subscription_id: response.id,
            init_point: response.init_point
        });
    } catch (err) {
        console.error('❌ Error al crear suscripción:', err.message || err);
        res.status(500).json({ error: 'Error al crear suscripción', detail: err.message });
    }
};

// 🔹 Pausar suscripción
export const pausarSuscripcion = async (req, res) => {
    try {
        const { subscriptionId } = req.params;
        const preapprovalAPI = new PreApproval(mercadopago);

        const response = await preapprovalAPI.update({
            id: subscriptionId,
            body: { status: 'paused' }
        });

        res.json({ message: '⏸️ Suscripción pausada', data: response });
    } catch (err) {
        console.error('❌ Error al pausar suscripción:', err.message || err);
        res.status(500).json({ error: 'Error al pausar suscripción', detail: err.message });
    }
};

// 🔹 Cancelar suscripción
export const cancelarSuscripcion = async (req, res) => {
    try {
        const { subscriptionId } = req.params;
        const preapprovalAPI = new PreApproval(mercadopago);

        const response = await preapprovalAPI.update({
            id: subscriptionId,
            body: { status: 'cancelled' }
        });

        res.json({ message: '❌ Suscripción cancelada', data: response });
    } catch (err) {
        console.error('❌ Error al cancelar suscripción:', err.message || err);
        res.status(500).json({ error: 'Error al cancelar suscripción', detail: err.message });
    }
};

// 🔹 Reanudar suscripción
export const reanudarSuscripcion = async (req, res) => {
    try {
        const { subscriptionId } = req.params;
        const preapprovalAPI = new PreApproval(mercadopago);

        const response = await preapprovalAPI.update({
            id: subscriptionId,
            body: { status: 'authorized' }
        });

        res.json({ message: '▶️ Suscripción reanudada', data: response });
    } catch (err) {
        console.error('❌ Error al reanudar suscripción:', err.message || err);
        res.status(500).json({ error: 'Error al reanudar suscripción', detail: err.message });
    }
};
