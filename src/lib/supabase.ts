// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

// In a real project, store these values in .env files and access via expo-constants or react-native-config
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'public-anon-key';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
