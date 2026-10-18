import { supabase } from './supabase';

export type WorkerAvailability = 'available' | 'busy' | 'offline';

export type WorkerProfile = {
  id: string;
  name: string;
  districtId: string;
  district: string;
  state: string;
  addressLine: string | null;
  experienceYears: number;
  verificationStatus: 'verified';
  availabilityStatus: WorkerAvailability;
  averageRating: number;
  reviewCount: number;
  completedJobsCount: number;
  hourlyRate: number | null;
  dailyRate: number | null;
  ratesNegotiable: boolean;
  services: { id: string; name: string }[];
};

type WorkerProfileRow = {
  id: string;
  worker_name: string;
  district_id: string;
  address_line: string | null;
  experience_years: number;
  verification_status: 'verified';
  availability_status: WorkerAvailability;
  average_rating: number;
  review_count: number;
  completed_jobs_count: number;
  hourly_rate: number | null;
  daily_rate: number | null;
  rates_negotiable: boolean;
  district: { state_name: string; district_name: string; is_active: boolean } | null;
  services: {
    service_category: { id: string; name: string; is_active: boolean } | null;
  }[];
};

export async function loadWorkers(): Promise<WorkerProfile[]> {
  const { data, error } = await supabase
    .from('worker_profiles')
    .select(`
      id,
      worker_name,
      district_id,
      address_line,
      experience_years,
      verification_status,
      availability_status,
      average_rating,
      review_count,
      completed_jobs_count,
      hourly_rate,
      daily_rate,
      rates_negotiable,
      district:districts!worker_profiles_district_id_fkey(state_name,district_name,is_active),
      services:worker_service_categories!worker_service_categories_worker_id_fkey(
        service_category:service_categories!worker_service_categories_service_category_id_fkey(id,name,is_active)
      )
    `)
    .eq('verification_status', 'verified')
    .order('average_rating', { ascending: false })
    .order('worker_name')
    .returns<WorkerProfileRow[]>();

  if (error) {
    throw new Error(`Unable to load verified workers: ${error.message}`);
  }

  return data.map((worker) => ({
    id: worker.id,
    name: worker.worker_name,
    districtId: worker.district_id,
    district: worker.district?.is_active ? worker.district.district_name : '',
    state: worker.district?.is_active ? worker.district.state_name : '',
    addressLine: worker.address_line,
    experienceYears: worker.experience_years,
    verificationStatus: worker.verification_status,
    availabilityStatus: worker.availability_status,
    averageRating: worker.average_rating,
    reviewCount: worker.review_count,
    completedJobsCount: worker.completed_jobs_count,
    hourlyRate: worker.hourly_rate,
    dailyRate: worker.daily_rate,
    ratesNegotiable: worker.rates_negotiable,
    services: worker.services.flatMap(({ service_category }) => (
      service_category?.is_active
        ? [{ id: service_category.id, name: service_category.name }]
        : []
    )),
  })).filter((worker) => worker.district && worker.services.length > 0);
}
