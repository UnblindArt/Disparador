import { ValidationError } from '../utils/validators.js';

export function validateRequest(schema) {
  return (req, res, next) => {
    try {
      const { error, value } = schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        const errors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
        }));

        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors,
        });
      }

      // Replace request body with validated and sanitized data
      req.body = value;
      next();
    } catch (err) {
      next(err);
    }
  };
}

export function validateQuery(schema) {
  return (req, res, next) => {
    try {
      const { error, value } = schema.validate(req.query, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        const errors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
        }));

        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors,
        });
      }

      req.query = value;
      next();
    } catch (err) {
      next(err);
    }
  };
}

export function validateParams(schema) {
  return (req, res, next) => {
    try {
      const { error, value } = schema.validate(req.params, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        const errors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
        }));

        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors,
        });
      }

      req.params = value;
      next();
    } catch (err) {
      next(err);
    }
  };
}

export default { validateRequest, validateQuery, validateParams };
