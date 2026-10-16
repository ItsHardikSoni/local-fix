import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import type { AuthError, Session, User } from '@supabase/supabase-js';
import { supabase, supabaseConfigured } from '../lib/supabase';

type AuthErrorMessage = Pick<AuthError, 'message'>;

const ensureProfileExists = async (user: User): Promise<AuthErrorMessage | null> => {
  const { data: profile, error: lookupError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (lookupError) return lookupError;
  if (profile) return null;

  const metadata = user.user_metadata ?? {};
  const fullName = typeof metadata.full_name === 'string' ? metadata.full_name : '';
  const phone = typeof metadata.phone === 'string' && metadata.phone.trim()
    ? metadata.phone
    : null;

  const { error: insertError } = await supabase.from('profiles').insert({
    id: user.id,
    full_name: fullName,
    phone,
    email: user.email ?? null,
  });

  return insertError;
};

type UserContextType = {
  district: string;
  setDistrict: (d: string) => void;
  session: Session | null;
  authLoading: boolean;
  signIn: (email: string, password: string) => Promise<AuthErrorMessage | null>;
  signUp: (email: string, password: string, fullName: string, phone: string) => Promise<{
    error: AuthErrorMessage | null;
    confirmationRequired: boolean;
  }>;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({
  children,
  district: initialDistrict,
}: {
  children: ReactNode;
  district: string;
}) => {
  const [district, setDistrict] = useState(initialDistrict);
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let authEventReceived = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      authEventReceived = true;
      if (mounted) {
        setSession(nextSession);
        setAuthLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (mounted) {
        if (!authEventReceived) setSession(currentSession);
        setAuthLoading(false);
      }
    }).catch(() => {
      if (mounted) setAuthLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!supabaseConfigured) {
      return { message: 'Supabase is not configured. Add the project URL and publishable key to .env.' };
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return error;

    return ensureProfileExists(data.user);
  };

  const signUp = async (email: string, password: string, fullName: string, phone: string) => {
    if (!supabaseConfigured) {
      return {
        error: { message: 'Supabase is not configured. Add the project URL and publishable key to .env.' },
        confirmationRequired: false,
      };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone || null,
        },
      },
    });

    if (error) return { error, confirmationRequired: false };
    if (data.session && data.user) {
      const profileError = await ensureProfileExists(data.user);
      if (profileError) return { error: profileError, confirmationRequired: false };
    }

    return { error: null, confirmationRequired: !data.session };
  };

  return (
    <UserContext.Provider value={{ district, setDistrict, session, authLoading, signIn, signUp }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return ctx;
};
