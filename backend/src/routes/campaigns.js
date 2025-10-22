import express from 'express';
import * as campaignController from '../controllers/campaignController.js';
import { authenticate } from '../middlewares/auth.js';
import { validateRequest } from '../middlewares/validation.js';
import { campaignSchemas } from '../utils/validators.js';
import { campaignLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

router.use(authenticate);

router.post('/', campaignLimiter, validateRequest(campaignSchemas.create), campaignController.createCampaign);
router.get('/', campaignController.getCampaigns);
router.get('/:id', campaignController.getCampaign);
router.put('/:id', validateRequest(campaignSchemas.update), campaignController.updateCampaign);
router.post('/:id/pause', campaignController.pauseCampaign);
router.post('/:id/resume', campaignController.resumeCampaign);
router.post('/:id/cancel', campaignController.cancelCampaign);
router.delete('/:id', campaignController.deleteCampaign);

export default router;
