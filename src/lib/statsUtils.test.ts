import { describe, it, expect } from 'vitest';
import { processActivityFrequency, processActivityTrend, processActivityDuration } from './statsUtils';
import { PuppyActivity } from './types';

const mockActivities: PuppyActivity[] = [
  {
    id: '1',
    activity_type: 'walk',
    activity_time: '2023-10-01T10:00:00.000Z',
    end_time: '2023-10-01T10:30:00.000Z',
    created_at: '2023-10-01T10:30:00.000Z',
  },
  {
    id: '2',
    activity_type: 'walk',
    activity_time: '2023-10-01T14:00:00.000Z',
    end_time: '2023-10-01T14:45:00.000Z',
    created_at: '2023-10-01T14:45:00.000Z',
  },
  {
    id: '3',
    activity_type: 'meal',
    activity_time: '2023-10-02T08:00:00.000Z',
    created_at: '2023-10-02T08:05:00.000Z',
  }
];

describe('statsUtils', () => {
  describe('processActivityFrequency', () => {
    it('should correctly count the frequency of each activity type', () => {
      const result = processActivityFrequency(mockActivities);
      
      const walkIndex = result.labels.indexOf('walk');
      const mealIndex = result.labels.indexOf('meal');
      
      expect(result.datasets[0].data[walkIndex]).toBe(2);
      expect(result.datasets[0].data[mealIndex]).toBe(1);
    });
  });

  describe('processActivityTrend', () => {
    it('should correctly group activities into the last 7 days', () => {
      // Use an anchor date so tests don't break based on current time
      const anchorDate = new Date('2023-10-02T12:00:00.000Z');
      const result = processActivityTrend(mockActivities, anchorDate);
      
      expect(result.labels).toHaveLength(7);
      
      // Oct 2nd should have 1 activity (meal)
      const oct2Index = result.labels.indexOf('2023-10-02');
      expect(result.datasets[0].data[oct2Index]).toBe(1);
      
      // Oct 1st should have 2 activities (walks)
      const oct1Index = result.labels.indexOf('2023-10-01');
      expect(result.datasets[0].data[oct1Index]).toBe(2);
    });
  });

  describe('processActivityDuration', () => {
    it('should correctly calculate the average duration in minutes for activities with end_time', () => {
      const result = processActivityDuration(mockActivities);
      
      // Walk 1 is 30 mins, Walk 2 is 45 mins. Average is 37.5, rounded to 38
      const walkIndex = result.labels.indexOf('walk');
      expect(result.datasets[0].data[walkIndex]).toBe(38);
      
      // Meal has no end_time, shouldn't be included
      expect(result.labels).not.toContain('meal');
    });
    
    it('should filter out absurd durations (negative or > 24 hours)', () => {
      const absurdActivities: PuppyActivity[] = [
        {
          id: '1',
          activity_type: 'sleep',
          activity_time: '2023-10-01T10:00:00.000Z',
          end_time: '2023-10-02T12:00:00.000Z', // 26 hours
          created_at: '2023-10-01T10:00:00.000Z'
        },
        {
          id: '2',
          activity_type: 'sleep',
          activity_time: '2023-10-01T10:00:00.000Z',
          end_time: '2023-10-01T11:00:00.000Z', // 60 mins
          created_at: '2023-10-01T10:00:00.000Z'
        }
      ];
      
      const result = processActivityDuration(absurdActivities);
      
      // It should only average the 60 min sleep, ignoring the 26 hour one
      const sleepIndex = result.labels.indexOf('sleep');
      expect(result.datasets[0].data[sleepIndex]).toBe(60);
    });
  });
});
