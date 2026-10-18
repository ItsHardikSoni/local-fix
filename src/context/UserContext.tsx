import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import type { AuthError, Session, User } from '@supabase/supabase-js';
import { supabase, supabaseConfigured } from '../lib/supabase';
import { otpApiConfigured, requestOtpApi } from '../lib/otp-api';

type AuthErrorMessage = Pick<AuthError, 'message'>;
type ProfileUpdateResult = {
  error: { message: string } | null;
  otpRequired: boolean;
};

export type UserProfile = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
};

const parseProfile = (value: unknown): UserProfile | null => {
  if (typeof value !== 'object' || value === null) return null;

  const profile = value as Record<string, unknown>;
  if (
    typeof profile.id !== 'string'
    || typeof profile.full_name !== 'string'
    || (profile.phone !== null && typeof profile.phone !== 'string')
    || (profile.email !== null && typeof profile.email !== 'string')
  ) {
    return null;
  }

  return {
    id: profile.id,
    full_name: profile.full_name,
    phone: profile.phone,
    email: profile.email,
  };
};

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
  profile: UserProfile | null;
  profileLoading: boolean;
  profileError: string | null;
  signIn: (email: string, password: string) => Promise<AuthErrorMessage | null>;
  signOut: () => Promise<AuthErrorMessage | null>;
  verifyProfileEmail: (email: string, code: string, fullName: string, phone: string) => Promise<AuthErrorMessage | null>;
  updateProfile: (fullName: string, email: string, phone: string) => Promise<ProfileUpdateResult>;
  verifySignUpOtp: (email: string, code: string, password: string, fullName: string, phone: string) => Promise<AuthErrorMessage | null>;
  signUp: (email: string) => Promise<{
    error: AuthErrorMessage | null;
    otpSent: boolean;
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
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

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

  useEffect(() => {
    const userId = session?.user.id;
    if (!userId || !supabaseConfigured) {
      setProfile(null);
      setProfileLoading(false);
      setProfileError(null);
      return;
    }

    let active = true;
    let revision = 0;
    setProfile(null);
    setProfileLoading(true);
    setProfileError(null);

    const loadProfile = async () => {
      const requestRevision = revision;
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, phone, email')
          .eq('id', userId)
          .maybeSingle();

        if (!active || requestRevision !== revision) return;

        if (error) {
          setProfileError(`Unable to load profile: ${error.message}`);
          setProfileLoading(false);
          return;
        }

        if (data === null) {
          setProfile(null);
          setProfileError('Your profile record could not be found.');
          setProfileLoading(false);
          return;
        }

        const nextProfile = parseProfile(data);
        if (!nextProfile) {
          setProfileError('The profile data returned by the server is invalid.');
          setProfileLoading(false);
          return;
        }

        setProfile(nextProfile);
        setProfileError(null);
        setProfileLoading(false);
      } catch (error) {
        if (!active || requestRevision !== revision) return;

        const details = error instanceof Error ? error.message : 'Unexpected network error';
        setProfileError(`Unable to load profile: ${details}`);
        setProfileLoading(false);
      }
    };

    const channel = supabase
      .channel(`profile:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          revision += 1;

          if (payload.eventType === 'DELETE') {
            setProfile(null);
            setProfileError('Your profile record was deleted.');
            setProfileLoading(false);
            return;
          }

          const nextProfile = parseProfile(payload.new);
          if (!nextProfile) {
            setProfileError('The profile update received from the server is invalid.');
            setProfileLoading(false);
            return;
          }

          setProfile(nextProfile);
          setProfileError(null);
          setProfileLoading(false);
        },
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          void loadProfile();
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setProfileError('Live profile updates are unavailable. Check your connection and Supabase Realtime settings.');
          setProfileLoading(false);
        }
      });

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [session?.user.id]);

  const signIn = async (email: string, password: string) => {
    if (!supabaseConfigured) {
      return { message: 'Supabase is not configured. Add the project URL and publishable key to .env.' };
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return error;

    return ensureProfileExists(data.user);
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return error;
  };

  const updateProfile = async (
    fullName: string,
    email: string,
    phone: string,
  ): Promise<ProfileUpdateResult> => {
    const currentUser = session?.user;
    if (!currentUser) {
      return { error: { message: 'You must be signed in to update your profile.' }, otpRequired: false };
    }
    if (!supabaseConfigured || !otpApiConfigured) {
      return {
        error: { message: 'Supabase or the OTP service is not configured. Check the Expo .env settings.' },
        otpRequired: false,
      };
    }

    const normalizedEmail = email.trim();
    try {
      if (normalizedEmail.toLowerCase() !== currentUser.email?.toLowerCase()) {
        await requestOtpApi<{ message: string }>(
          '/v1/profile/email/request-otp',
          { email: normalizedEmail },
          session.access_token,
        );
        return { error: null, otpRequired: true };
      }

      const result = await requestOtpApi<{ profile: unknown }>(
        '/v1/profile/update',
        { fullName: fullName.trim(), phone: phone.trim() },
        session.access_token,
      );
      const nextProfile = parseProfile(result.profile);
      if (!nextProfile) {
        return {
          error: { message: 'Your profile was updated, but the service returned invalid profile data.' },
          otpRequired: false,
        };
      }

      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        return {
          error: { message: `Your profile was updated, but your session could not be refreshed: ${refreshError.message}` },
          otpRequired: false,
        };
      }
      setProfile(nextProfile);
      setProfileError(null);
      return { error: null, otpRequired: false };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to update your profile.';
      return { error: { message }, otpRequired: false };
    }
  };

  const verifyProfileEmail = async (
    email: string,
    code: string,
    fullName: string,
    phone: string,
  ): Promise<AuthErrorMessage | null> => {
    if (!session || !otpApiConfigured) {
      return { message: 'Sign in and configure the OTP service before verifying your new email.' };
    }

    try {
      const result = await requestOtpApi<{ profile: unknown }>(
        '/v1/profile/email/verify-otp',
        { email: email.trim(), code: code.trim(), fullName: fullName.trim(), phone: phone.trim() },
        session.access_token,
      );
      const nextProfile = parseProfile(result.profile);
      if (!nextProfile) {
        return { message: 'Your account was updated, but the service returned invalid profile data.' };
      }

      const { error } = await supabase.auth.refreshSession();
      if (error) {
        return { message: `Your account was updated, but your session could not be refreshed: ${error.message}` };
      }
      setProfile(nextProfile);
      setProfileError(null);
      return null;
    } catch (error) {
      return { message: error instanceof Error ? error.message : 'Unable to verify your new email.' };
    }
  };

  const signUp = async (email: string) => {
    if (!supabaseConfigured || !otpApiConfigured) {
      return {
        error: { message: 'Supabase or the OTP service is not configured. Check the Expo .env settings.' },
        otpSent: false,
      };
    }

    try {
      await requestOtpApi<{ message: string }>('/v1/auth/signup/request-otp', { email: email.trim() });
      return { error: null, otpSent: true };
    } catch (error) {
      return {
        error: { message: error instanceof Error ? error.message : 'Unable to send the verification code.' },
        otpSent: false,
      };
    }
  };

  const verifySignUpOtp = async (
    email: string,
    code: string,
    password: string,
    fullName: string,
    phone: string,
  ): Promise<AuthErrorMessage | null> => {
    if (!supabaseConfigured || !otpApiConfigured) {
      return { message: 'Supabase or the OTP service is not configured. Check the Expo .env settings.' };
    }

    try {
      await requestOtpApi<{ message: string }>('/v1/auth/signup/verify-otp', {
        email: email.trim(),
        code: code.trim(),
        password,
        fullName: fullName.trim(),
        phone: phone.trim(),
      });
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      return error;
    } catch (error) {
      return { message: error instanceof Error ? error.message : 'Unable to verify your email and create your account.' };
    }
  };

  return (
    <UserContext.Provider value={{
      district,
      setDistrict,
      session,
      authLoading,
      profile,
      profileLoading,
      profileError,
      signIn,
      signOut,
      verifyProfileEmail,
      updateProfile,
      verifySignUpOtp,
      signUp,
    }}>
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
