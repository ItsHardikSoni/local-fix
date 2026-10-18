import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createOtp,
  hashOtp,
  isValidEmail,
  isValidPassword,
  isValidPhone,
  normalizeEmail,
} from '../api/otp.mjs';

test('OTP generation returns six numeric digits', () => {
  for (let i = 0; i < 100; i += 1) {
    assert.match(createOtp(), /^\d{6}$/);
  }
});

test('OTP hashes are bound to email, purpose, code, and secret', () => {
  const hash = hashOtp('user@example.com', 'signup', '123456', 'test-secret');
  assert.equal(hash, hashOtp('user@example.com', 'signup', '123456', 'test-secret'));
  assert.notEqual(hash, hashOtp('other@example.com', 'signup', '123456', 'test-secret'));
  assert.notEqual(hash, hashOtp('user@example.com', 'email_change', '123456', 'test-secret'));
  assert.notEqual(hash, hashOtp('user@example.com', 'signup', '654321', 'test-secret'));
  assert.notEqual(hash, hashOtp('user@example.com', 'signup', '123456', 'other-secret'));
});

test('email, password, and phone validation rejects malformed values', () => {
  assert.equal(normalizeEmail('  User@Example.COM  '), 'user@example.com');
  assert.equal(isValidEmail('user@example.com'), true);
  assert.equal(isValidEmail('invalid'), false);
  assert.equal(isValidPassword('StrongPass1!'), true);
  assert.equal(isValidPassword('weak'), false);
  assert.equal(isValidPhone('1234567890'), true);
  assert.equal(isValidPhone(''), true);
  assert.equal(isValidPhone('12345'), false);
});
