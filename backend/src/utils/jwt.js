import jwt from 'jsonwebtoken';
import config from '../config/env.js';

export function generateAccessToken(payload) {
  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.JWT_ACCESS_EXPIRATION,
    issuer: config.APP_NAME,
  });
}

export function generateRefreshToken(payload) {
  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.JWT_REFRESH_EXPIRATION,
    issuer: config.APP_NAME,
  });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, config.JWT_SECRET, {
      issuer: config.APP_NAME,
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    throw error;
  }
}

export function decodeToken(token) {
  return jwt.decode(token);
}

export default {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  decodeToken,
};
