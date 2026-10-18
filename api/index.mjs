import 'dotenv/config';
import { Buffer } from 'node:buffer';
import { createServer } from 'node:http';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import {
  createOtp,
  hashOtp,
  isValidEmail,
  isValidPassword,
  isValidPhone,
  normalizeEmail,
} from './otp.mjs';

const requiredEnvironment = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'EMAIL_FROM',
  'OTP_HASH_SECRET',
];

const missingEnvironment = requiredEnvironment.filter((name) => !process.env[name]);
if (missingEnvironment.length > 0) {
  throw new Error(`Missing required server environment variables: ${missingEnvironment.join(', ')}`);
}
if (process.env.OTP_HASH_SECRET.length < 32) {
  throw new Error('OTP_HASH_SECRET must be at least 32 characters long.');
}

const port = Number(process.env.PORT ?? 4000);
const smtpPort = Number(process.env.SMTP_PORT);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be a valid TCP port.');
}
if (!Number.isInteger(smtpPort) || smtpPort < 1 || smtpPort > 65535) {
  throw new Error('SMTP_PORT must be a valid TCP port.');
}

const allowedOrigins = new Set(
  (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
);
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);
const mailer = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: smtpPort,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const sendJson = (response, status, payload) => {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  response.end(JSON.stringify(payload));
};

const readJson = async (request) => {
  if (!request.headers['content-type']?.toLowerCase().includes('application/json')) {
    throw new HttpError(415, 'Send the request as JSON.');
  }

  let body = '';
  for await (const chunk of request) {
    body += chunk;
    if (Buffer.byteLength(body) > 16_384) {
      throw new HttpError(413, 'Request body is too large.');
    }
  }

  try {
    const value = JSON.parse(body);
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new Error('JSON body must be an object.');
    }
    return value;
  } catch {
    throw new HttpError(400, 'Request body must contain valid JSON.');
  }
};

const requireString = (value, field, maxLength = 256) => {
  if (typeof value !== 'string' || value.length > maxLength) {
    throw new HttpError(400, `${field} is invalid.`);
  }
  return value.trim();
};

const requireEmail = (value) => {
  const email = normalizeEmail(requireString(value, 'Email', 320));
  if (!isValidEmail(email)) throw new HttpError(400, 'Enter a valid email address.');
  return email;
};

const validateProfile = (fullNameValue, phoneValue) => {
  const fullName = requireString(fullNameValue, 'Full name', 120);
  const phone = requireString(phoneValue ?? '', 'Phone number', 20).replace(/[\s()+-]/g, '');
  if (!fullName) throw new HttpError(400, 'Full name is required.');
  if (!isValidPhone(phone)) throw new HttpError(400, 'Phone number must contain exactly 10 digits or be empty.');
  return { fullName, phone: phone || null };
};

const authenticate = async (request) => {
  const authorization = request.headers.authorization;
  const match = typeof authorization === 'string' && authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) throw new HttpError(401, 'Sign in to continue.');

  const { data, error } = await supabaseAdmin.auth.getUser(match[1]);
  if (error || !data.user) throw new HttpError(401, 'Your session has expired. Sign in again.');
  return data.user;
};

const createChallenge = async ({ email, purpose, userId = null }) => {
  const now = new Date();
  const { error: cleanupError } = await supabaseAdmin
    .from('email_otp_challenges')
    .delete()
    .lt('expires_at', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString());
  if (cleanupError) throw new HttpError(500, 'Unable to prepare email verification. Try again later.');

  const { data: recent, error: recentError } = await supabaseAdmin
    .from('email_otp_challenges')
    .select('created_at')
    .eq('email', email)
    .eq('purpose', purpose)
    .gte('created_at', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false })
    .limit(5);

  if (recentError) throw new HttpError(500, 'Unable to prepare email verification. Try again later.');
  if (recent.length >= 5) {
    throw new HttpError(429, 'Too many verification codes requested. Try again later.');
  }
  if (recent[0] && now.getTime() - new Date(recent[0].created_at).getTime() < 60_000) {
    throw new HttpError(429, 'Wait one minute before requesting another verification code.');
  }

  const code = createOtp();
  const { data: challenge, error: insertError } = await supabaseAdmin
    .from('email_otp_challenges')
    .insert({
      email,
      purpose,
      user_id: userId,
      code_hash: hashOtp(email, purpose, code, process.env.OTP_HASH_SECRET),
      expires_at: new Date(now.getTime() + 10 * 60 * 1000).toISOString(),
    })
    .select('id')
    .single();

  if (insertError) throw new HttpError(500, 'Unable to prepare email verification. Try again later.');

  try {
    await mailer.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Your LocalFix verification code',
      text: `Your LocalFix verification code is ${code}. It expires in 10 minutes. If you did not request this code, you can ignore this email.`,
      html: `<p>Your LocalFix verification code is:</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">${code}</p><p>This code expires in 10 minutes. If you did not request it, you can ignore this email.</p>`,
    });
  } catch (error) {
    console.error('Could not send LocalFix verification email:', error instanceof Error ? error.message : 'Unknown SMTP error');
    const { error: deleteError } = await supabaseAdmin
      .from('email_otp_challenges')
      .delete()
      .eq('id', challenge.id);
    if (deleteError) {
      console.error('Could not invalidate unsent LocalFix verification code:', deleteError.message);
    }
    throw new HttpError(502, 'Unable to send the verification email. Check your address and try again later.');
  }
};

const consumeChallenge = async ({ email, purpose, codeValue, userId = null }) => {
  const code = requireString(codeValue, 'Verification code', 6);
  if (!/^\d{6}$/.test(code)) throw new HttpError(400, 'Enter the six-digit verification code.');

  const { data, error } = await supabaseAdmin.rpc('consume_email_otp', {
    p_email: email,
    p_purpose: purpose,
    p_code_hash: hashOtp(email, purpose, code, process.env.OTP_HASH_SECRET),
    p_user_id: userId,
  });
  if (error) throw new HttpError(500, 'Unable to verify the code. Try again later.');
  if (data === 'expired') throw new HttpError(400, 'That verification code has expired. Request a new code.');
  if (data === 'locked') throw new HttpError(429, 'Too many incorrect attempts. Request a new code.');
  if (data !== 'verified') throw new HttpError(400, 'The verification code is incorrect or has expired.');
};

const saveProfile = async (userId, email, fullName, phone) => {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .upsert({
      id: userId,
      full_name: fullName,
      phone,
      email,
    }, { onConflict: 'id' })
    .select('id, full_name, phone, email')
    .single();

  if (error) throw new HttpError(500, `Account authentication was updated, but the profile could not be synchronized: ${error.message}`);
  return data;
};

const requestSignupOtp = async (body) => {
  const email = requireEmail(body.email);
  await createChallenge({ email, purpose: 'signup' });
  return { message: 'Verification code sent.' };
};

const verifySignupOtp = async (body) => {
  const email = requireEmail(body.email);
  const fullName = requireString(body.fullName, 'Full name', 120);
  const password = body.password;
  if (typeof password !== 'string' || password.length > 128) {
    throw new HttpError(400, 'Password is invalid.');
  }
  const { phone } = validateProfile(fullName, body.phone ?? '');
  if (!fullName) throw new HttpError(400, 'Full name is required.');
  if (!isValidPassword(password)) {
    throw new HttpError(400, 'Password must have at least 8 characters with uppercase, lowercase, a number, and a symbol.');
  }

  await consumeChallenge({
    email,
    purpose: 'signup',
    codeValue: body.code,
  });

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, phone },
  });
  if (error || !data.user) {
    throw new HttpError(error?.code === 'email_exists' ? 409 : 400, error?.message ?? 'Unable to create your account.');
  }

  try {
    await saveProfile(data.user.id, email, fullName, phone);
  } catch (error) {
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(data.user.id);
    if (deleteError) {
      console.error('Could not roll back account after profile sync failure:', deleteError.message);
    }
    throw error;
  }

  return { message: 'Email verified and account created.' };
};

const requestEmailChangeOtp = async (request, body) => {
  const user = await authenticate(request);
  const email = requireEmail(body.email);
  if (email === user.email?.toLowerCase()) {
    throw new HttpError(400, 'This is already your account email.');
  }

  await createChallenge({
    email,
    purpose: 'email_change',
    userId: user.id,
  });
  return { message: 'Verification code sent.' };
};

const verifyEmailChangeOtp = async (request, body) => {
  const user = await authenticate(request);
  const email = requireEmail(body.email);
  const { fullName, phone } = validateProfile(body.fullName, body.phone ?? '');
  await consumeChallenge({
    email,
    purpose: 'email_change',
    codeValue: body.code,
    userId: user.id,
  });

  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
    email,
    email_confirm: true,
    user_metadata: { ...user.user_metadata, full_name: fullName, phone },
  });
  if (error || !data.user) {
    throw new HttpError(400, error?.message ?? 'Unable to update your account email.');
  }

  const profile = await saveProfile(user.id, data.user.email ?? email, fullName, phone);
  return { message: 'Email verified and profile updated.', profile };
};

const updateProfile = async (request, body) => {
  const user = await authenticate(request);
  const { fullName, phone } = validateProfile(body.fullName, body.phone ?? '');
  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
    user_metadata: { ...user.user_metadata, full_name: fullName, phone },
  });
  if (error || !data.user) {
    throw new HttpError(400, error?.message ?? 'Unable to update your account.');
  }

  const profile = await saveProfile(user.id, data.user.email ?? user.email ?? null, fullName, phone);
  return { message: 'Profile updated.', profile };
};

const routes = new Map([
  ['POST /v1/auth/signup/request-otp', async (_request, body) => requestSignupOtp(body)],
  ['POST /v1/auth/signup/verify-otp', async (_request, body) => verifySignupOtp(body)],
  ['POST /v1/profile/email/request-otp', requestEmailChangeOtp],
  ['POST /v1/profile/email/verify-otp', verifyEmailChangeOtp],
  ['POST /v1/profile/update', updateProfile],
]);

const server = createServer(async (request, response) => {
  const origin = request.headers.origin;
  if (origin) {
    if (!allowedOrigins.has(origin)) {
      sendJson(response, 403, { error: 'This app origin is not allowed.' });
      return;
    }
    response.setHeader('Access-Control-Allow-Origin', origin);
    response.setHeader('Vary', 'Origin');
  }

  response.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (request.method === 'OPTIONS') {
    response.writeHead(204);
    response.end();
    return;
  }

  if (request.method === 'GET' && request.url === '/health') {
    sendJson(response, 200, { status: 'ok' });
    return;
  }

  const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);
  const route = routes.get(`${request.method} ${url.pathname}`);
  if (!route) {
    sendJson(response, 404, { error: 'Endpoint not found.' });
    return;
  }

  try {
    const body = await readJson(request);
    sendJson(response, 200, await route(request, body));
  } catch (error) {
    if (error instanceof HttpError) {
      sendJson(response, error.status, { error: error.message });
      return;
    }
    console.error('LocalFix OTP API request failed:', error instanceof Error ? error.message : 'Unknown error');
    sendJson(response, 500, { error: 'The request could not be completed. Try again later.' });
  }
});

server.listen(port, () => {
  console.info(`LocalFix OTP API listening on port ${port}`);
});
