export type ActivityType = 'meal' | 'walk' | 'wee' | 'poo' | 'sleep' | 'play' | 'training' | 'chew' | 'med' | 'vet' | 'wake' | 'other';

export interface PuppyActivity {
  id: string;
  activity_type: ActivityType;
  activity_time: string;
  end_time?: string;
  notes?: string;
  parent_activity_id?: string;
}
