import * as campaignService from '../services/campaignService.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

export const createCampaign = asyncHandler(async (req, res) => {
  const campaign = await campaignService.createCampaign(req.user.id, req.body);

  res.status(201).json({
    success: true,
    data: campaign,
  });
});

export const getCampaigns = asyncHandler(async (req, res) => {
  const campaigns = await campaignService.getCampaigns(req.user.id, req.query);

  res.json({
    success: true,
    data: campaigns,
  });
});

export const getCampaign = asyncHandler(async (req, res) => {
  const campaign = await campaignService.getCampaignById(req.user.id, req.params.id);

  res.json({
    success: true,
    data: campaign,
  });
});

export const updateCampaign = asyncHandler(async (req, res) => {
  const campaign = await campaignService.updateCampaign(req.user.id, req.params.id, req.body);

  res.json({
    success: true,
    data: campaign,
  });
});

export const pauseCampaign = asyncHandler(async (req, res) => {
  const campaign = await campaignService.pauseCampaign(req.user.id, req.params.id);

  res.json({
    success: true,
    data: campaign,
  });
});

export const resumeCampaign = asyncHandler(async (req, res) => {
  const campaign = await campaignService.resumeCampaign(req.user.id, req.params.id);

  res.json({
    success: true,
    data: campaign,
  });
});

export const cancelCampaign = asyncHandler(async (req, res) => {
  const campaign = await campaignService.cancelCampaign(req.user.id, req.params.id);

  res.json({
    success: true,
    data: campaign,
  });
});

export const deleteCampaign = asyncHandler(async (req, res) => {
  await campaignService.deleteCampaign(req.user.id, req.params.id);

  res.json({
    success: true,
    message: 'Campaign deleted successfully',
  });
});

export default {
  createCampaign,
  getCampaigns,
  getCampaign,
  updateCampaign,
  pauseCampaign,
  resumeCampaign,
  cancelCampaign,
  deleteCampaign,
};
