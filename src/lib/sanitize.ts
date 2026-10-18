const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

export function sanitizeText(value: string, maxLength: number): string {
  return value
    .replace(CONTROL_CHARS, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

export function sanitizeMultiline(value: string, maxLength: number): string {
  return value
    .replace(CONTROL_CHARS, '')
    .replace(/[^\S\n]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, maxLength);
}

export function sanitizeEmail(value: string): string {
  return sanitizeText(value, 254).toLowerCase();
}

export function sanitizePhoneDigits(value: string, maxLength = 10): string {
  return value.replace(/\D/g, '').slice(0, maxLength);
}
