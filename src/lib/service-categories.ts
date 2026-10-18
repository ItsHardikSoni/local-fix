import { supabase } from './supabase';

export type ServiceCategory = {
  id: string;
  name: string;
  description: string;
};

export async function loadServiceCategories(): Promise<ServiceCategory[]> {
  const { data, error } = await supabase
    .from('service_categories')
    .select('id, name, description')
    .eq('is_active', true)
    .order('name');

  if (error) {
    throw new Error(`Unable to load available services: ${error.message}`);
  }

  return data;
}
