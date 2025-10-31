import express from 'express';
import {
  getMonthlyForecast,
  getSalesPipeline,
  updateOpportunity,
  getForecastStats
} from '../controllers/forecastController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

// Previsão financeira mensal
router.get('/monthly', getMonthlyForecast);

// Pipeline de vendas completo
router.get('/pipeline', getSalesPipeline);

// Estatísticas gerais
router.get('/stats', getForecastStats);

// Atualizar oportunidade
router.put('/opportunities/:id', updateOpportunity);

export default router;
