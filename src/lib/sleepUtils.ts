import { PuppyActivity } from './supabase';

export function findPreviousSleep(activities: PuppyActivity[], currentActivity: PuppyActivity): PuppyActivity | null {
  const sortedActivities = [...activities].sort(
    (a, b) => new Date(a.activity_time).getTime() - new Date(b.activity_time).getTime()
  );

  const currentIndex = sortedActivities.findIndex((a) => a.id === currentActivity.id);

  for (let i = currentIndex - 1; i >= 0; i--) {
    if (sortedActivities[i].activity_type === 'sleep') {
      return sortedActivities[i];
    }
    if (sortedActivities[i].activity_type === 'wake') {
      return null;
    }
  }

  return null;
}

export function calculateSleepDuration(sleepTime: string, wakeTime: string): string {
  const sleep = new Date(sleepTime);
  const wake = new Date(wakeTime);

  const durationMs = wake.getTime() - sleep.getTime();
  const hours = Math.floor(durationMs / (1000 * 60 * 60));
  const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export function getSleepDurationForActivity(
  activity: PuppyActivity,
  allActivities: PuppyActivity[]
): { duration: string; sleepActivity: PuppyActivity } | null {
  if (activity.activity_type !== 'wake') {
    return null;
  }

  const previousSleep = findPreviousSleep(allActivities, activity);
  if (!previousSleep) {
    return null;
  }

  return {
    duration: calculateSleepDuration(previousSleep.activity_time, activity.activity_time),
    sleepActivity: previousSleep,
  };
}
