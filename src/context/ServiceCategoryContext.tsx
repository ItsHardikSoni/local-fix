import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { supabase } from '../lib/supabase';
import { useUser } from './UserContext';
import { loadServiceCategories, type ServiceCategory } from '../lib/service-categories';

type ServiceCategoryContextValue = {
  categories: ServiceCategory[];
  loading: boolean;
  error: string | null;
  realtimeConnected: boolean;
  realtimeError: string | null;
  refreshCategories: () => Promise<void>;
};

const ServiceCategoryContext = createContext<ServiceCategoryContextValue | undefined>(undefined);

export function ServiceCategoryProvider({ children }: { children: ReactNode }) {
  const { session } = useUser();
  const userId = session?.user.id ?? null;
  const userIdRef = useRef(userId);
  const requestVersionRef = useRef(0);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<{
    userId: string;
    error: string | null;
  } | null>(null);
  const loading = Boolean(userId && loadedUserId !== userId);
  const realtimeConnected = Boolean(userId && realtimeStatus?.userId === userId && !realtimeStatus.error);
  const realtimeError = userId && realtimeStatus?.userId === userId ? realtimeStatus.error : null;

  const refreshCategories = useCallback(async () => {
    const requestVersion = ++requestVersionRef.current;
    const requestedUserId = userId;
    if (!requestedUserId) return;
    try {
      const result = await loadServiceCategories();
      if (userIdRef.current !== requestedUserId || requestVersionRef.current !== requestVersion) return;
      setCategories(result);
      setError(null);
      setLoadedUserId(requestedUserId);
    } catch (cause) {
      if (userIdRef.current !== requestedUserId || requestVersionRef.current !== requestVersion) return;
      setError(cause instanceof Error ? cause.message : 'Unexpected network error');
      setLoadedUserId(requestedUserId);
    }
  }, [userId]);

  useEffect(() => {
    userIdRef.current = userId;
    if (!userId) {
      requestVersionRef.current += 1;
      return;
    }

    let active = true;
    const initialRequestVersion = ++requestVersionRef.current;

    const channel = supabase
      .channel('service-categories')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'service_categories' },
        () => {
          if (active) void refreshCategories();
        },
      )
      .subscribe((status, channelError) => {
        if (!active) return;
        if (status === 'SUBSCRIBED') {
          setRealtimeStatus({ userId, error: null });
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setRealtimeStatus({
            userId,
            error: channelError?.message ?? 'Live service updates are unavailable.',
          });
        } else if (status === 'CLOSED') {
          setRealtimeStatus({ userId, error: 'The live service updates connection was closed.' });
        }
      });

    loadServiceCategories()
      .then((result) => {
        if (
          active
          && userIdRef.current === userId
          && requestVersionRef.current === initialRequestVersion
        ) {
          setCategories(result);
          setError(null);
          setLoadedUserId(userId);
        }
      })
      .catch((cause: unknown) => {
        if (
          active
          && userIdRef.current === userId
          && requestVersionRef.current === initialRequestVersion
        ) {
          setError(cause instanceof Error ? cause.message : 'Unexpected network error');
          setLoadedUserId(userId);
        }
      });

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [userId, refreshCategories]);

  return (
    <ServiceCategoryContext.Provider value={{
      categories,
      loading,
      error: error ?? realtimeError,
      realtimeConnected,
      realtimeError,
      refreshCategories,
    }}>
      {children}
    </ServiceCategoryContext.Provider>
  );
}

export function useServiceCategories(): ServiceCategoryContextValue {
  const context = useContext(ServiceCategoryContext);
  if (!context) {
    throw new Error('useServiceCategories must be used within a ServiceCategoryProvider');
  }
  return context;
}
