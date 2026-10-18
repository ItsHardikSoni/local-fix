import { createHmac, randomInt } from 'node:crypto';

export const normalizeEmail = (email) => email.trim().toLowerCase();

export const createOtp = () => String(randomInt(0, 1_000_000)).padStart(6, '0');

export const hashOtp = (email, purpose, code, secret) => createHmac('sha256', secret)
  .update(`${email}:${purpose}:${code}`)
  .digest('hex');

export const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);

export const isValidPassword = (password) => (
  typeof password === 'string'
  && /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).{8,}$/.test(password)
);

export const isValidPhone = (phone) => phone === '' || /^\d{10}$/.test(phone);
