export type ActivityType = 'meal' | 'wee' | 'poo' | 'walk' | 'play' | 'sleep' | 'wake' | 'training' | 'other';

export interface PuppyActivity {
  id: string;
  user_id: string;
  activity_type: ActivityType;
  activity_time: string;
  notes: string;
  created_at: string;
}
