import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import type { AuthError, Session, User } from '@supabase/supabase-js';
import { supabase, supabaseConfigured } from '../lib/supabase';

type AuthErrorMessage = Pick<AuthError, 'message'>;
type ProfileUpdateResult = {
  error: { message: string } | null;
  emailConfirmationRequired: boolean;
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
  session: Session | null;
  authLoading: boolean;
  profile: UserProfile | null;
  profileLoading: boolean;
  profileError: string | null;
  signIn: (email: string, password: string) => Promise<AuthErrorMessage | null>;
  signOut: () => Promise<AuthErrorMessage | null>;
  updateProfile: (fullName: string, email: string, phone: string) => Promise<ProfileUpdateResult>;
  signUp: (email: string, password: string, fullName: string, phone: string) => Promise<{
    error: AuthErrorMessage | null;
    confirmationRequired: boolean;
  }>;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: {
  children: ReactNode;
}) => {
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
      return { error: { message: 'You must be signed in to update your profile.' }, emailConfirmationRequired: false };
    }
    if (!supabaseConfigured) {
      return {
        error: { message: 'Supabase is not configured. Check the Expo .env settings.' },
        emailConfirmationRequired: false,
      };
    }

    const normalizedEmail = email.trim();
    const emailChanged = normalizedEmail.toLowerCase() !== currentUser.email?.toLowerCase();
    const { data, error } = await supabase.auth.updateUser({
      ...(emailChanged ? { email: normalizedEmail } : {}),
      data: {
        full_name: fullName.trim(),
        phone: phone.trim() || null,
      },
    });
    if (error) return { error, emailConfirmationRequired: false };
    if (!data.user) {
      return {
        error: { message: 'Supabase did not return the updated account.' },
        emailConfirmationRequired: false,
      };
    }

    const { data: updatedProfile, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: currentUser.id,
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        email: data.user.email ?? currentUser.email ?? null,
      }, { onConflict: 'id' })
      .select('id, full_name, phone, email')
      .single();
    if (profileError) {
      return {
        error: {
          message: `Your account was updated, but your profile could not be synchronized: ${profileError.message}`,
        },
        emailConfirmationRequired: false,
      };
    }

    const nextProfile = parseProfile(updatedProfile);
    if (!nextProfile) {
      return {
        error: { message: 'Your account was updated, but Supabase returned invalid profile data.' },
        emailConfirmationRequired: false,
      };
    }

    setProfile(nextProfile);
    setProfileError(null);
    return {
      error: null,
      emailConfirmationRequired: emailChanged
        && data.user.email?.toLowerCase() !== normalizedEmail.toLowerCase(),
    };
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    phone: string,
  ) => {
    if (!supabaseConfigured) {
      return {
        error: { message: 'Supabase is not configured. Check the Expo .env settings.' },
        confirmationRequired: false,
      };
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          phone: phone.trim() || null,
        },
      },
    });
    if (error) return { error, confirmationRequired: false };
    if (!data.user) {
      return {
        error: { message: 'Supabase did not return the created account.' },
        confirmationRequired: false,
      };
    }

    if (data.session) {
      const profileError = await ensureProfileExists(data.user);
      if (profileError) return { error: profileError, confirmationRequired: false };
    }

    return { error: null, confirmationRequired: !data.session };
  };

  return (
    <UserContext.Provider value={{
      session,
      authLoading,
      profile,
      profileLoading,
      profileError,
      signIn,
      signOut,
      updateProfile,
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
