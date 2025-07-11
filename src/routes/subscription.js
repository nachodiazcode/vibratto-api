import express from 'express';
import {
    crearPlan,
    crearSuscripcion,
    pausarSuscripcion,
    cancelarSuscripcion,
    reanudarSuscripcion
} from '../controllers/subscriptionController.js';

const router = express.Router();

router.post('/plan', crearPlan);
router.post('/create', crearSuscripcion);
router.put('/pause/:subscriptionId', pausarSuscripcion);
router.put('/cancel/:subscriptionId', cancelarSuscripcion);
router.put('/resume/:subscriptionId', reanudarSuscripcion);

export default router;
