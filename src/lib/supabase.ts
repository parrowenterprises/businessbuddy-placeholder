import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

export type Profile = {
  id: string;
  business_name: string;
  service_types: string[];
  phone: string;
  subscription_tier: 'free' | 'professional';
  customer_limit: number;
  created_at: string;
};

export type Customer = {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  lat?: number;
  lng?: number;
  notes?: string;
  total_spent: number;
  last_job_date?: string;
  created_at: string;
  updated_at: string;
};

export type Service = {
  id: string;
  user_id: string;
  name: string;
  default_price: number;
  description: string;
  is_custom: boolean;
  created_at: string;
};

export type QuoteStatus = 'draft' | 'sent' | 'approved' | 'rejected' | 'expired';

export type Quote = {
  id: string;
  user_id: string;
  customer_id: string;
  status: QuoteStatus;
  total_amount: number;
  valid_until: string;
  notes?: string;
  customer_notes?: string;
  created_at: string;
  sent_at?: string;
  approved_at?: string;
  rejected_at?: string;
};

export type QuoteService = {
  id: string;
  quote_id: string;
  service_name: string;
  price: number;
  quantity: number;
  notes?: string;
  created_at: string;
};

export type JobStatus = 'draft' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'partial' | 'paid';

export interface Job {
  id: string;
  user_id: string;
  customer_id: string;
  quote_id?: string;
  title: string;
  description: string;
  scheduled_date?: string;
  start_time?: string;
  end_time?: string;
  status: JobStatus;
  payment_status: PaymentStatus;
  total_amount: number;
  created_at: string;
  updated_at: string;
  customers?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  job_services?: JobService[];
  quotes?: {
    id: string;
    status: string;
  };
}

export interface JobService {
  id: string;
  job_id: string;
  service_name: string;
  price: number;
  quantity: number;
  notes?: string;
}

export interface JobPhoto {
  id: string;
  job_id: string;
  photo_url: string;
  photo_type: 'before' | 'after' | 'progress';
  caption?: string;
  created_at: string;
}

export interface JobNote {
  id: string;
  job_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export interface TimeEntry {
  id: string;
  job_id: string;
  user_id: string;
  start_time: string;
  end_time?: string;
  description?: string;
  created_at: string;
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export type Invoice = {
  id: string;
  user_id: string;
  customer_id: string;
  job_id: string;
  status: InvoiceStatus;
  total_amount: number;
  amount_paid: number;
  due_date: string;
  payment_terms?: string;
  stripe_payment_link?: string;
  stripe_payment_intent_id?: string;
  notes?: string;
  created_at: string;
  sent_at?: string;
  paid_at?: string;
};

export type InvoicePayment = {
  id: string;
  invoice_id: string;
  amount: number;
  payment_method: 'stripe' | 'cash' | 'check' | 'other';
  stripe_payment_intent_id?: string;
  notes?: string;
  created_at: string;
}; 