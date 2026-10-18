const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, '');

export const otpApiConfigured = Boolean(API_URL);

export async function requestOtpApi<T>(
  path: string,
  body: Record<string, string>,
  accessToken?: string,
): Promise<T> {
  if (!API_URL) {
    throw new Error('OTP service is not configured. Set EXPO_PUBLIC_API_URL in the Expo .env file.');
  }
  if (!__DEV__ && !API_URL.startsWith('https://')) {
    throw new Error('The OTP service must use HTTPS outside local development.');
  }

  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(body),
  });

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error(`OTP service returned an invalid response (HTTP ${response.status}).`);
  }

  if (typeof payload !== 'object' || payload === null) {
    throw new Error(`OTP service returned an invalid response (HTTP ${response.status}).`);
  }

  const result = payload as Record<string, unknown>;
  if (!response.ok) {
    throw new Error(typeof result.error === 'string'
      ? result.error
      : `OTP service request failed (HTTP ${response.status}).`);
  }

  return payload as T;
}
