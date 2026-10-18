import { supabase } from './supabase';

export type StateOption = {
  state_name: string;
};

export type DistrictOption = {
  id: string;
  district_name: string;
  state_name: string;
};

export type CustomerAddress = {
  id: string;
  district_id: string;
  address_line: string;
  society_name: string | null;
  flat_number: string | null;
  latitude: number | null;
  longitude: number | null;
};

export type CustomerAddressInput = Omit<CustomerAddress, 'id'>;

export async function loadAddressOptions(): Promise<{
  states: StateOption[];
  districts: DistrictOption[];
}> {
  const [districtsResult, statesResult] = await Promise.all([
    supabase
      .from('districts')
      .select('id, state_name, district_name')
      .eq('is_active', true)
      .order('district_name')
      .returns<DistrictOption[]>(),
    supabase
      .from('districts')
      .select('state_name')
      .eq('is_active', true)
      .order('state_name')
      .returns<StateOption[]>(),
  ]);

  if (districtsResult.error) {
    throw new Error(`Unable to load districts: ${districtsResult.error.message}`);
  }
  if (statesResult.error) {
    throw new Error(`Unable to load states: ${statesResult.error.message}`);
  }

  const states = [...new Set(statesResult.data.map((item) => item.state_name.trim()).filter(Boolean))]
    .map((state_name) => ({ state_name }));
  return { states, districts: districtsResult.data };
}

export async function loadLatestCustomerAddress(customerId: string): Promise<CustomerAddress | null> {
  const { data, error } = await supabase
    .from('customer_addresses')
    .select('id, district_id, address_line, society_name, flat_number, latitude, longitude')
    .eq('customer_id', customerId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle<CustomerAddress>();

  if (error) {
    throw new Error(`Unable to load your saved address: ${error.message}`);
  }
  return data;
}

export async function saveCustomerAddress(
  customerId: string,
  addressId: string | null,
  input: CustomerAddressInput,
): Promise<CustomerAddress> {
  const values = {
    ...input,
    customer_id: customerId,
    updated_at: new Date().toISOString(),
  };
  const result = addressId
    ? await supabase
      .from('customer_addresses')
      .update(values)
      .eq('id', addressId)
      .eq('customer_id', customerId)
      .select('id, district_id, address_line, society_name, flat_number, latitude, longitude')
      .single()
    : await supabase
      .from('customer_addresses')
      .insert(values)
      .select('id, district_id, address_line, society_name, flat_number, latitude, longitude')
      .single();

  if (result.error) {
    throw new Error(`Unable to save your address: ${result.error.message}`);
  }
  return result.data;
}
