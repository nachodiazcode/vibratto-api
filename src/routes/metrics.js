import express from 'express';
import { obtenerMetricas } from '../controllers/metricasController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/me', protect, obtenerMetricas);

export default router;
