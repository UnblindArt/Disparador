import Joi from 'joi';

// User validation schemas
export const userSchemas = {
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    name: Joi.string().min(2).max(255).required(),
    phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional(),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  updateProfile: Joi.object({
    name: Joi.string().min(2).max(255).optional(),
    phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional(),
    email: Joi.string().email().optional(),
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(8).required(),
  }),
};

// Contact validation schemas
export const contactSchemas = {
  create: Joi.object({
    phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required(),
    name: Joi.string().max(255).optional(),
    email: Joi.string().email().optional(),
    tags: Joi.array().items(Joi.string()).optional(),
    customFields: Joi.object().optional(),
  }),

  update: Joi.object({
    name: Joi.string().max(255).optional(),
    email: Joi.string().email().optional(),
    tags: Joi.array().items(Joi.string()).optional(),
    customFields: Joi.object().optional(),
  }),

  bulkImport: Joi.object({
    contacts: Joi.array().items(
      Joi.object({
        phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required(),
        name: Joi.string().max(255).optional(),
        email: Joi.string().email().optional(),
        tags: Joi.array().items(Joi.string()).optional(),
      })
    ).min(1).max(1000).required(),
  }),
};

// Message template validation schemas
export const templateSchemas = {
  create: Joi.object({
    name: Joi.string().min(2).max(255).required(),
    content: Joi.string().min(1).max(4096).required(),
    variables: Joi.array().items(Joi.string()).optional(),
    category: Joi.string().valid('marketing', 'transactional', 'notification').optional(),
  }),

  update: Joi.object({
    name: Joi.string().min(2).max(255).optional(),
    content: Joi.string().min(1).max(4096).optional(),
    variables: Joi.array().items(Joi.string()).optional(),
    category: Joi.string().valid('marketing', 'transactional', 'notification').optional(),
  }),
};

// Campaign validation schemas
export const campaignSchemas = {
  create: Joi.object({
    name: Joi.string().min(2).max(255).required(),
    templateId: Joi.string().uuid().optional(),
    message: Joi.string().min(1).max(4096).when('templateId', {
      is: Joi.exist(),
      then: Joi.optional(),
      otherwise: Joi.required(),
    }),
    targetType: Joi.string().valid('all', 'group', 'tag', 'individual').required(),
    groupId: Joi.string().uuid().when('targetType', {
      is: 'group',
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    tags: Joi.array().items(Joi.string()).when('targetType', {
      is: 'tag',
      then: Joi.array().items(Joi.string()).required().min(1),
      otherwise: Joi.optional(),
    }),
    contactIds: Joi.array().items(Joi.string().uuid()).when('targetType', {
      is: 'individual',
      then: Joi.array().items(Joi.string().uuid()).required().min(1),
      otherwise: Joi.optional(),
    }),
    scheduledFor: Joi.date().iso().min('now').optional(),
    variables: Joi.object().optional(),
  }),

  update: Joi.object({
    name: Joi.string().min(2).max(255).optional(),
    scheduledFor: Joi.date().iso().min('now').optional(),
    status: Joi.string().valid('draft', 'scheduled', 'paused', 'cancelled').optional(),
  }),
};

// Message validation schemas
export const messageSchemas = {
  send: Joi.object({
    to: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required(),
    message: Joi.string().min(1).max(4096).required(),
    mediaUrl: Joi.string().uri().optional(),
    scheduledFor: Joi.date().iso().min('now').optional(),
  }),

  sendBulk: Joi.object({
    messages: Joi.array().items(
      Joi.object({
        to: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required(),
        message: Joi.string().min(1).max(4096).required(),
        mediaUrl: Joi.string().uri().optional(),
      })
    ).min(1).max(100).required(),
    scheduledFor: Joi.date().iso().min('now').optional(),
  }),
};

// Helper function to validate
export function validate(schema, data) {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
    }));
    throw new ValidationError('Validation failed', errors);
  }

  return value;
}

// Custom validation error
export class ValidationError extends Error {
  constructor(message, errors) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
    this.statusCode = 400;
  }
}

export default {
  userSchemas,
  contactSchemas,
  templateSchemas,
  campaignSchemas,
  messageSchemas,
  validate,
  ValidationError,
};
