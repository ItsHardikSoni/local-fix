import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

function normalizeProjectUrl(url: string): string {
  return url.trim().replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');
}

function jwtRole(token: string): string | null {
  const payload = token.split('.')[1];
  if (!payload) return null;
  try {
    const padded = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = globalThis.atob(padded);
    const parsed = JSON.parse(json) as { role?: unknown };
    return typeof parsed.role === 'string' ? parsed.role : null;
  } catch {
    return null;
  }
}

const configuredUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
  ? normalizeProjectUrl(process.env.EXPO_PUBLIC_SUPABASE_URL)
  : '';
const configuredKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? '';
const keyRole = configuredKey ? jwtRole(configuredKey) : null;

export const supabaseConfigured = Boolean(
  configuredUrl.startsWith('https://')
  && configuredKey
  && keyRole !== 'service_role',
);

export const supabase = createClient(
  supabaseConfigured ? configuredUrl : 'https://invalid.local',
  supabaseConfigured ? configuredKey : 'invalid-anon-key',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);
