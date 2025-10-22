import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import config from '../config/env.js';

const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = Buffer.from(config.ENCRYPTION_KEY, 'hex');
const IV_LENGTH = 16;

// Password hashing
export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

// Data encryption/decryption
export function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return `${iv.toString('hex')}:${encrypted}`;
}

export function decrypt(text) {
  const [ivHex, encryptedText] = text.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

// Generate random tokens
export function generateToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

// Generate API key
export function generateApiKey() {
  return `sk_${generateToken(32)}`;
}

export default {
  hashPassword,
  comparePassword,
  encrypt,
  decrypt,
  generateToken,
  generateApiKey,
};
