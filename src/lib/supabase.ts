import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  business_name: string;
  service_types: string[];
  phone: string;
  subscription_tier: 'free' | 'professional';
  customer_limit: number;
  created_at: string;
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

export type JobStatus = 'draft' | 'in_progress' | 'completed' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'partial' | 'paid';

export interface Job {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  description: string;
  status: JobStatus;
  payment_status: PaymentStatus;
  total_amount: number;
  customer_id: string;
  business_id: string;
  quote_id?: string;
  customers: {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  job_services: {
    id: string;
    name: string;
    description: string;
    price: number;
    quantity: number;
  }[];
  quotes?: {
    id: string;
    status: QuoteStatus;
  };
}

export type JobService = {
  id: string;
  job_id: string;
  service_name: string;
  price: number;
  quantity: number;
  notes?: string;
  created_at: string;
};

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