import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import type { AuthError, Session } from '@supabase/supabase-js';
import { supabase, supabaseConfigured } from '../lib/supabase';

type AuthErrorMessage = Pick<AuthError, 'message'>;

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

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error;
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
    return { error, confirmationRequired: !error && !data.session };
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
