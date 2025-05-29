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