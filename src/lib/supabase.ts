import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type ActivityType = 'meal' | 'wee' | 'poo' | 'walk' | 'play' | 'sleep' | 'wake' | 'training' | 'other';

export interface PuppyActivity {
  id: string;
  user_id: string;
  activity_type: ActivityType;
  activity_time: string;
  notes: string;
  created_at: string;
}
