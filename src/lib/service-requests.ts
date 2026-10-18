import { supabase } from './supabase';

export type ServiceRequestInput = {
  customer_id: string;
  service_category_id: string;
  district_id: string;
  description: string;
  address_line: string;
  society_name: string | null;
  flat_number: string | null;
  latitude: number | null;
  longitude: number | null;
  proposed_amount: number | null;
  preferred_worker_id: string;
};

type ServiceRequestRow = {
  id: string;
  description: string;
  address_line: string;
  society_name: string | null;
  flat_number: string | null;
  proposed_amount: number | null;
  preferred_worker_id: string | null;
  assigned_worker_id: string | null;
  status: 'pending' | 'accepted';
  created_at: string;
  completed_at: string | null;
  service_category: { name: string };
  district: { district_name: string; state_name: string };
};

export type WorkerServiceRequest = ServiceRequestRow;
export type WorkerRequestAvailability = 'available' | 'busy' | 'offline';
export type WorkerRequestInbox = {
  availabilityStatus: WorkerRequestAvailability;
  requests: WorkerServiceRequest[];
};

export type CustomerServiceRequest = {
  id: string;
  description: string;
  proposed_amount: number | null;
  status: 'pending' | 'accepted' | 'completed' | 'cancelled';
  created_at: string;
  completed_at: string | null;
  service_category: { name: string };
  district: { district_name: string; state_name: string };
  assigned_worker: { worker_name: string; average_rating: number; review_count: number } | null;
  review_rating: number | null;
};

export async function createServiceRequest(input: ServiceRequestInput): Promise<string> {
  const { data, error } = await supabase
    .from('service_requests')
    .insert(input)
    .select('id')
    .single();

  if (error) {
    throw new Error(`Unable to submit your service request: ${error.message}`);
  }

  return data.id;
}

export async function loadWorkerServiceRequests(workerId: string): Promise<WorkerRequestInbox> {
  const { data: worker, error: workerError } = await supabase
    .from('worker_profiles')
    .select('verification_status,availability_status')
    .eq('id', workerId)
    .maybeSingle();

  if (workerError) {
    throw new Error(`Unable to check worker verification: ${workerError.message}`);
  }
  if (!worker) {
    throw new Error('This account does not have a worker profile.');
  }
  if (worker.verification_status !== 'verified') {
    throw new Error('Only verified workers can receive service requests.');
  }

  const [{ data: ignoredRows, error: ignoredError }, { data: requests, error: requestError }] = await Promise.all([
    supabase
      .from('service_request_responses')
      .select('service_request_id')
      .eq('worker_id', workerId)
      .eq('response', 'ignored'),
    supabase
      .from('service_requests')
      .select(`
        id,
        description,
        address_line,
        society_name,
        flat_number,
        proposed_amount,
        preferred_worker_id,
        assigned_worker_id,
        status,
        created_at,
        completed_at,
        service_category:service_categories!service_requests_service_category_id_fkey(name),
        district:districts!service_requests_district_id_fkey(district_name,state_name)
      `)
      .or(`status.eq.pending,and(status.eq.accepted,assigned_worker_id.eq.${workerId})`)
      .neq('customer_id', workerId)
      .order('created_at', { ascending: false })
      .returns<ServiceRequestRow[]>(),
  ]);

  if (ignoredError) {
    throw new Error(`Unable to load ignored requests: ${ignoredError.message}`);
  }
  if (requestError) {
    throw new Error(`Unable to load service requests: ${requestError.message}`);
  }

  const ignoredIds = new Set((ignoredRows ?? []).map((row) => row.service_request_id));
  return {
    availabilityStatus: worker.availability_status as WorkerRequestAvailability,
    requests: (requests ?? []).filter((request) => request.status === 'accepted' || !ignoredIds.has(request.id)),
  };
}

export async function ignoreServiceRequest(requestId: string): Promise<void> {
  const { error } = await supabase
    .from('service_request_responses')
    .insert({ service_request_id: requestId, response: 'ignored' });

  if (error) {
    throw new Error(`Unable to ignore this service request: ${error.message}`);
  }
}

export async function acceptServiceRequest(requestId: string): Promise<void> {
  const { error } = await supabase.rpc('accept_service_request', {
    request_id: requestId,
  });

  if (error) {
    throw new Error(`Unable to accept this service request: ${error.message}`);
  }
}

export async function completeServiceRequest(requestId: string): Promise<void> {
  const { error } = await supabase.rpc('complete_service_request', {
    request_id: requestId,
  });

  if (error) {
    throw new Error(`Unable to complete this service request: ${error.message}`);
  }
}

export async function setWorkerRequestAvailability(
  availabilityStatus: 'available' | 'offline',
): Promise<void> {
  const { error } = await supabase.rpc('set_service_request_worker_availability', {
    requested_status: availabilityStatus,
  });

  if (error) {
    throw new Error(`Unable to update availability: ${error.message}`);
  }
}

export async function loadCustomerServiceRequests(customerId: string): Promise<CustomerServiceRequest[]> {
  const [{ data: requests, error: requestError }, { data: reviews, error: reviewError }] = await Promise.all([
    supabase
      .from('service_requests')
      .select(`
        id,
        description,
        proposed_amount,
        status,
        created_at,
        completed_at,
        service_category:service_categories!service_requests_service_category_id_fkey(name),
        district:districts!service_requests_district_id_fkey(district_name,state_name),
        assigned_worker:worker_profiles!service_requests_assigned_worker_id_fkey(worker_name,average_rating,review_count)
      `)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .returns<Omit<CustomerServiceRequest, 'review_rating'>[]>(),
    supabase
      .from('worker_reviews')
      .select('service_request_id,rating')
      .eq('customer_id', customerId),
  ]);

  if (requestError) {
    throw new Error(`Unable to load your service requests: ${requestError.message}`);
  }
  if (reviewError) {
    throw new Error(`Unable to load your reviews: ${reviewError.message}`);
  }

  const reviewByRequest = new Map((reviews ?? []).map((review) => [review.service_request_id, review.rating]));
  return (requests ?? []).map((request) => ({
    ...request,
    review_rating: reviewByRequest.get(request.id) ?? null,
  }));
}

export async function reviewServiceRequest(requestId: string, rating: number): Promise<void> {
  const { error } = await supabase.rpc('review_completed_service_request', {
    request_id: requestId,
    requested_rating: rating,
  });

  if (error) {
    throw new Error(`Unable to submit your review: ${error.message}`);
  }
}
