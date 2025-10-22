import * as contactService from '../services/contactService.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

export const createContact = asyncHandler(async (req, res) => {
  const contact = await contactService.createContact(req.user.id, req.body);

  res.status(201).json({
    success: true,
    data: contact,
  });
});

export const getContacts = asyncHandler(async (req, res) => {
  const contacts = await contactService.getContacts(req.user.id, req.query);

  res.json({
    success: true,
    data: contacts,
  });
});

export const getContact = asyncHandler(async (req, res) => {
  const contact = await contactService.getContactById(req.user.id, req.params.id);

  res.json({
    success: true,
    data: contact,
  });
});

export const updateContact = asyncHandler(async (req, res) => {
  const contact = await contactService.updateContact(req.user.id, req.params.id, req.body);

  res.json({
    success: true,
    data: contact,
  });
});

export const deleteContact = asyncHandler(async (req, res) => {
  await contactService.deleteContact(req.user.id, req.params.id);

  res.json({
    success: true,
    message: 'Contact deleted successfully',
  });
});

export const bulkImport = asyncHandler(async (req, res) => {
  const contacts = await contactService.bulkImportContacts(req.user.id, req.body.contacts);

  res.status(201).json({
    success: true,
    data: contacts,
  });
});

export const updateOptIn = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const metadata = {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  };

  const contact = await contactService.updateOptInStatus(req.user.id, req.params.id, status, metadata);

  res.json({
    success: true,
    data: contact,
  });
});

export const getStats = asyncHandler(async (req, res) => {
  const stats = await contactService.getContactStats(req.user.id);

  res.json({
    success: true,
    data: stats,
  });
});

export default {
  createContact,
  getContacts,
  getContact,
  updateContact,
  deleteContact,
  bulkImport,
  updateOptIn,
  getStats,
};
