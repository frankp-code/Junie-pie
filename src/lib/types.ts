export type ActivityType = 'meal' | 'wee' | 'poo' | 'walk' | 'play' | 'sleep' | 'training' | 'other' | 'chew';

export interface PuppyActivity {
  id: string;
  user_id: string;
  activity_type: ActivityType;
  activity_time: string;
  end_time?: string;
  notes: string;
  created_at: string;
}
