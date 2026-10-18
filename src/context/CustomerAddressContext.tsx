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
import {
  loadAddressOptions,
  loadLatestCustomerAddress,
  saveCustomerAddress,
  type CustomerAddress,
  type CustomerAddressInput,
  type DistrictOption,
  type StateOption,
} from '../lib/customer-addresses';

type CustomerAddressContextValue = {
  address: CustomerAddress | null;
  states: StateOption[];
  districts: DistrictOption[];
  addressLoading: boolean;
  addressError: string | null;
  realtimeConnected: boolean;
  realtimeError: string | null;
  refreshAddressData: (showLoading?: boolean) => Promise<void>;
  saveAddress: (addressId: string | null, input: CustomerAddressInput) => Promise<CustomerAddress>;
};

const CustomerAddressContext = createContext<CustomerAddressContextValue | undefined>(undefined);

export function CustomerAddressProvider({ children }: { children: ReactNode }) {
  const { session } = useUser();
  const customerId = session?.user.id ?? null;
  const [address, setAddress] = useState<CustomerAddress | null>(null);
  const [states, setStates] = useState<StateOption[]>([]);
  const [districts, setDistricts] = useState<DistrictOption[]>([]);
  const [addressLoading, setAddressLoading] = useState(Boolean(customerId));
  const [addressError, setAddressError] = useState<string | null>(null);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [realtimeError, setRealtimeError] = useState<string | null>(null);
  const customerIdRef = useRef(customerId);
  const refreshVersionRef = useRef(0);
  customerIdRef.current = customerId;

  const refreshAddressData = useCallback(async (showLoading = true) => {
    const requestVersion = ++refreshVersionRef.current;
    const requestedCustomerId = customerId;
    if (!customerId) {
      setAddress(null);
      setStates([]);
      setDistricts([]);
      setAddressLoading(false);
      setAddressError(null);
      return;
    }

    if (showLoading) setAddressLoading(true);
    setAddressError(null);
    try {
      const [options, savedAddress] = await Promise.all([
        loadAddressOptions(),
        loadLatestCustomerAddress(customerId),
      ]);
      if (
        customerIdRef.current !== requestedCustomerId
        || refreshVersionRef.current !== requestVersion
      ) return;
      setStates(options.states);
      setDistricts(options.districts);
      setAddress(savedAddress);
    } catch (error) {
      if (
        customerIdRef.current !== requestedCustomerId
        || refreshVersionRef.current !== requestVersion
      ) return;
      const details = error instanceof Error ? error.message : 'Unexpected network error';
      setAddressError(details);
    } finally {
      if (
        customerIdRef.current === requestedCustomerId
        && refreshVersionRef.current === requestVersion
      ) setAddressLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    if (!customerId) {
      setAddress(null);
      setStates([]);
      setDistricts([]);
      setAddressLoading(false);
      setRealtimeConnected(false);
      setRealtimeError(null);
      return;
    }

    let active = true;
    refreshVersionRef.current += 1;
    setAddress(null);
    setStates([]);
    setDistricts([]);
    setAddressLoading(true);
    setAddressError(null);
    setRealtimeConnected(false);
    setRealtimeError(null);

    const channel = supabase
      .channel(`customer-addresses:${customerId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'customer_addresses',
          filter: `customer_id=eq.${customerId}`,
        },
        () => {
          if (active) void refreshAddressData(false);
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'districts',
        },
        () => {
          if (active) void refreshAddressData(false);
        },
      )
      .subscribe((status, error) => {
        if (!active) return;
        if (status === 'SUBSCRIBED') {
          setRealtimeConnected(true);
          setRealtimeError(null);
          void refreshAddressData();
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setRealtimeConnected(false);
          setRealtimeError(error?.message ?? 'Live address updates are unavailable.');
        } else if (status === 'CLOSED') {
          setRealtimeConnected(false);
          setRealtimeError('The live address updates connection was closed.');
        }
      });

    void refreshAddressData();

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [customerId, refreshAddressData]);

  const saveAddress = useCallback(async (
    addressId: string | null,
    input: CustomerAddressInput,
  ) => {
    if (!customerId) throw new Error('Sign in before saving a service address.');
    const savedAddress = await saveCustomerAddress(customerId, addressId, input);
    refreshVersionRef.current += 1;
    setAddressLoading(false);
    setAddressError(null);
    setAddress(savedAddress);
    return savedAddress;
  }, [customerId]);

  return (
    <CustomerAddressContext.Provider value={{
      address,
      states,
      districts,
      addressLoading,
      addressError,
      realtimeConnected,
      realtimeError,
      refreshAddressData,
      saveAddress,
    }}>
      {children}
    </CustomerAddressContext.Provider>
  );
}

export function useCustomerAddress(): CustomerAddressContextValue {
  const context = useContext(CustomerAddressContext);
  if (!context) {
    throw new Error('useCustomerAddress must be used within a CustomerAddressProvider');
  }
  return context;
}
