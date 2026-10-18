const AUTH_MESSAGES = new Set([
  'Invalid login credentials',
  'Email not confirmed',
  'User already registered',
  'Password should be at least 6 characters',
  'Signup requires a valid password',
  'Unable to validate email address: invalid format',
]);

export function toPublicErrorMessage(error: { message: string } | string, fallback: string): string {
  const message = typeof error === 'string' ? error : error.message;
  if (__DEV__) return message;
  if (AUTH_MESSAGES.has(message)) return message;
  if (/too many requests|rate limit/i.test(message)) {
    return 'Too many attempts. Please wait a minute and try again.';
  }
  return fallback;
}
