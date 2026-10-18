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
import { loadWorkers, type WorkerProfile } from '../lib/workers';

type WorkerDirectoryValue = {
  workers: WorkerProfile[];
  loading: boolean;
  error: string | null;
  realtimeConnected: boolean;
  realtimeError: string | null;
  refreshWorkers: () => Promise<void>;
};

const WorkerDirectoryContext = createContext<WorkerDirectoryValue | undefined>(undefined);

export function WorkerDirectoryProvider({ children }: { children: ReactNode }) {
  const { session } = useUser();
  const userId = session?.user.id ?? null;
  const userIdRef = useRef(userId);
  const requestVersionRef = useRef(0);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const [workers, setWorkers] = useState<WorkerProfile[]>([]);
  const [loadError, setLoadError] = useState<{ userId: string; message: string } | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<{
    userId: string;
    error: string | null;
  } | null>(null);
  const loading = Boolean(userId && loadedUserId !== userId);
  const realtimeConnected = Boolean(userId && realtimeStatus?.userId === userId && !realtimeStatus.error);
  const realtimeError = userId && realtimeStatus?.userId === userId ? realtimeStatus.error : null;
  const visibleWorkers = loadedUserId === userId ? workers : [];
  const currentLoadError = userId && loadError?.userId === userId ? loadError.message : null;

  const refreshWorkers = useCallback(async () => {
    const requestVersion = ++requestVersionRef.current;
    const requestedUserId = userId;
    if (!requestedUserId) return;

    try {
      const nextWorkers = await loadWorkers();
      if (userIdRef.current !== requestedUserId || requestVersionRef.current !== requestVersion) return;
      setWorkers(nextWorkers);
      setLoadError(null);
      setLoadedUserId(requestedUserId);
    } catch (cause) {
      if (userIdRef.current !== requestedUserId || requestVersionRef.current !== requestVersion) return;
      setLoadError({
        userId: requestedUserId,
        message: cause instanceof Error ? cause.message : 'Unexpected network error',
      });
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
    const refreshChannel = supabase
      .channel(`worker-directory:${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'worker_profiles' }, () => {
        if (active) void refreshWorkers();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'worker_service_categories' }, () => {
        if (active) void refreshWorkers();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'districts' }, () => {
        if (active) void refreshWorkers();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_categories' }, () => {
        if (active) void refreshWorkers();
      })
      .subscribe((status, channelError) => {
        if (!active) return;
        if (status === 'SUBSCRIBED') {
          setRealtimeStatus({ userId, error: null });
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setRealtimeStatus({
            userId,
            error: channelError?.message ?? 'Live worker updates are unavailable.',
          });
        } else if (status === 'CLOSED') {
          setRealtimeStatus({ userId, error: 'The live worker updates connection was closed.' });
        }
      });

    loadWorkers()
      .then((nextWorkers) => {
        if (
          active
          && userIdRef.current === userId
          && requestVersionRef.current === initialRequestVersion
        ) {
          setWorkers(nextWorkers);
          setLoadError(null);
          setLoadedUserId(userId);
        }
      })
      .catch((cause: unknown) => {
        if (
          active
          && userIdRef.current === userId
          && requestVersionRef.current === initialRequestVersion
        ) {
          setLoadError({
            userId,
            message: cause instanceof Error ? cause.message : 'Unexpected network error',
          });
          setLoadedUserId(userId);
        }
      });

    return () => {
      active = false;
      void supabase.removeChannel(refreshChannel);
    };
  }, [refreshWorkers, userId]);

  return (
    <WorkerDirectoryContext.Provider value={{
      workers: visibleWorkers,
      loading,
      error: currentLoadError ?? realtimeError,
      realtimeConnected,
      realtimeError,
      refreshWorkers,
    }}>
      {children}
    </WorkerDirectoryContext.Provider>
  );
}

export function useWorkerDirectory(): WorkerDirectoryValue {
  const context = useContext(WorkerDirectoryContext);
  if (!context) {
    throw new Error('useWorkerDirectory must be used within a WorkerDirectoryProvider');
  }
  return context;
}
