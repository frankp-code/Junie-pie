import { useState } from 'react';
import { PuppyActivity } from '../lib/types';
import {
  Droplets,
  Soup,
  Footprints,
  BedDouble,
  Clock,
  Sun,
  Moon,
  Dog,
  Heart,
  Droplet,
} from 'lucide-react';

interface StatsProps {
  activities: PuppyActivity[];
}

type StatView = 'day' | 'week' | 'month';

const calculateTotalWalkMinutes = (activities: PuppyActivity[]): number => {
  let totalMinutes = 0;
  const sortedActivities = [...activities].sort((a, b) => new Date(a.activity_time).getTime() - new Date(b.activity_time).getTime());

  sortedActivities.forEach((activity, index) => {
    if (activity.activity_type === 'walk') {
      if (activity.end_time) {
        const duration = (new Date(activity.end_time).getTime() - new Date(activity.activity_time).getTime()) / (1000 * 60);
        totalMinutes += duration;
      } else {
        const nextActivity = sortedActivities[index + 1];
        if (nextActivity) {
          const duration = (new Date(nextActivity.activity_time).getTime() - new Date(activity.activity_time).getTime()) / (1000 * 60);
          totalMinutes += duration;
        }
      }
    }
  });

  return Math.round(totalMinutes);
};

const getLastSleepSession = (activities: PuppyActivity[]) => {
  const sortedActivities = [...activities].sort((a, b) => new Date(b.activity_time).getTime() - new Date(a.activity_time).getTime());
  
  const lastWake = sortedActivities.find(a => a.activity_type === 'wake');
  if (!lastWake) return null;

  const lastWakeTime = new Date(lastWake.activity_time).getTime();

  const correspondingSleep = sortedActivities.find(a => 
    a.activity_type === 'sleep' && new Date(a.activity_time).getTime() < lastWakeTime
  );

  if (!correspondingSleep) return null;

  const sleepTime = new Date(correspondingSleep.activity_time);
  const wakeTime = new Date(lastWake.activity_time);

  const durationMs = wakeTime.getTime() - sleepTime.getTime();
  const totalMinutes = Math.floor(durationMs / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  let duration = '';
  if (hours > 0) duration += `${hours}h `;
  if (minutes > 0) duration += `${minutes}m`;

  return {
    duration: duration.trim(),
    sleepTime: sleepTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
    wakeTime: wakeTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
  };
};

const calculateNapMinutes = (activities: PuppyActivity[]) => {
    const sortedActivities = [...activities].sort(
      (a, b) => new Date(a.activity_time).getTime() - new Date(b.activity_time).getTime()
    );
  
    let totalNapMinutes = 0;
  
    for (let i = 0; i < sortedActivities.length; i++) {
      const activity = sortedActivities[i];
  
      if (activity.activity_type === 'sleep') {
        const sleepTime = new Date(activity.activity_time);
        
        let wakeActivity = null;
        for (let j = i + 1; j < sortedActivities.length; j++) {
          if (sortedActivities[j].activity_type === 'wake') {
            wakeActivity = sortedActivities[j];
            break;
          }
          if (sortedActivities[j].activity_type === 'sleep') {
            break;
          }
        }
  
        if (wakeActivity) {
          const wakeTime = new Date(wakeActivity.activity_time);
          if (sleepTime.toDateString() === wakeTime.toDateString()) {
            const hour = wakeTime.getHours();
            if (hour >= 7 && hour < 22) { // Naps are between 7 AM and 10 PM
                const durationMs = wakeTime.getTime() - sleepTime.getTime();
                const minutes = Math.floor(durationMs / (1000 * 60));
                totalNapMinutes += minutes;
            }
          }
        }
      }
    }
  
    return totalNapMinutes;
};

type StatCardProps = {
    icon: React.ReactNode;
    title: string;
    value: string;
    footer?: string | React.ReactNode;
    color: string;
  };
  
const StatCard = ({ icon, title, value, footer, color }: StatCardProps) => (
    <div className={`rounded-2xl p-4 shadow-sm ${color}`}>
        <div className="flex items-center gap-4">
            <div className="w-10 h-10 flex items-center justify-center">{icon}</div>
            <div>
                <p className="text-sm font-medium opacity-80">{title}</p>
                <p className="text-2xl font-bold">{value}</p>
            </div>
        </div>
        {footer && <p className="text-xs opacity-70 mt-3">{footer}</p>}
    </div>
);

type DayStatsProps = {
    activities: PuppyActivity[];
}

const DayStats = ({ activities }: DayStatsProps) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayActivities = activities.filter((activity) => {
    const activityDate = new Date(activity.activity_time);
    return activityDate >= today;
  });

  const getCount = (type: string) => todayActivities.filter(a => a.activity_type === type).length;
  const getLastTime = (type: string) => {
    const last = todayActivities.find(a => a.activity_type === type);
    return last ? new Date(last.activity_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : null;
  };

  const weeCount = getCount('wee');
  const lastWeeTime = getLastTime('wee');

  const pooCount = getCount('poo');
  const lastPooTime = getLastTime('poo');

  const mealCount = getCount('meal');
  const lastMealTime = getLastTime('meal');

  const walkCount = getCount('walk');
  const totalWalkMinutes = calculateTotalWalkMinutes(todayActivities);
  const walkHours = Math.floor(totalWalkMinutes / 60);
  const walkRemainingMinutes = totalWalkMinutes % 60;

  const lastSleep = getLastSleepSession(activities);
  const napMinutes = calculateNapMinutes(todayActivities);
  const napHours = Math.floor(napMinutes / 60);
  const napRemainingMinutes = napMinutes % 60;

  const isMorning = new Date().getHours() < 12;

  return (
    <div className="space-y-4 pt-4">
      <div className="px-4 text-center">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center justify-center gap-2">
              Good {isMorning ? 'morning' : 'afternoon'}! {isMorning ? <Sun className="text-yellow-500"/> : <Moon className="text-indigo-500" />}
          </h2>
          <p className="text-gray-500 flex items-center justify-center gap-2">
              Here's June's daily brief <Dog size={16} className="inline" /> <Heart size={16} className="inline text-red-500" />
          </p>
      </div>
      
      <div className="space-y-4 p-4">
        <StatCard 
            icon={<Droplets size={32} className="text-blue-800" />} 
            title="Wee Breaks" 
            value={weeCount > 0 ? `${weeCount} times` : 'None yet'}
            footer={lastWeeTime ? `Last break at ${lastWeeTime}`: ''}
            color="bg-blue-100 text-blue-900"
        />
        <StatCard 
            icon={<Droplet size={32} className="text-yellow-800" />} 
            title="Poo Breaks" 
            value={pooCount > 0 ? `${pooCount} times` : 'None yet'}
            footer={lastPooTime ? `Last break at ${lastPooTime}`: ''}
            color="bg-yellow-100 text-yellow-900"
        />
        <StatCard 
            icon={<Soup size={32} className="text-red-800" />} 
            title="Meals" 
            value={mealCount > 0 ? `${mealCount} times` : 'None yet'}
            footer={lastMealTime ? `Last meal at ${lastMealTime}` : ''}
            color="bg-red-100 text-red-900"
        />
        <StatCard 
            icon={<Footprints size={32} className="text-green-800" />} 
            title="Walks" 
            value={`${walkHours > 0 ? `${walkHours}h ` : ''}${walkRemainingMinutes}m total`}
            footer={walkCount > 0 ? `${walkCount} walks today` : 'No walks yet'}
            color="bg-green-100 text-green-900"
        />
        {lastSleep && (
             <StatCard 
                icon={<BedDouble size={32} className="text-purple-800" />} 
                title="Last Sleep"
                value={lastSleep.duration}
                footer={<><Clock size={12} className="inline-block mr-1"/> {lastSleep.sleepTime} - {lastSleep.wakeTime}</>}
                color="bg-purple-100 text-purple-900"
            />
        )}
        {napMinutes > 0 && (
            <StatCard 
                icon={<Clock size={32} className="text-orange-800" />} 
                title="Total Nap Time"
                value={`${napHours > 0 ? `${napHours}h ` : ''}${napRemainingMinutes}m`}
                footer="Daytime naps today"
                color="bg-orange-100 text-orange-900"
            />
        )}
      </div>
    </div>
  );
}

const getWeekDateRange = () => {
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    return { startOfWeek, endOfWeek };
};

const getMonthDateRange = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);
    return { startOfMonth, endOfMonth };
};

type PeriodStatsProps = {
    activities: PuppyActivity[];
    period: 'week' | 'month';
}

const PeriodStats = ({ activities, period }: PeriodStatsProps) => {
    const { start, end, title } = (() => {
        if (period === 'week') {
            const { startOfWeek, endOfWeek } = getWeekDateRange();
            return { start: startOfWeek, end: endOfWeek, title: 'This Week' };
        }
        const { startOfMonth, endOfMonth } = getMonthDateRange();
        return { start: startOfMonth, end: endOfMonth, title: 'This Month' };
    })();

    const periodActivities = activities.filter(a => {
        const activityDate = new Date(a.activity_time);
        return activityDate >= start && activityDate <= end;
    });

    const daysInPeriod = (end.getTime() - start.getTime()) / (1000 * 3600 * 24);

    const weeCount = periodActivities.filter(a => a.activity_type === 'wee').length;
    const pooCount = periodActivities.filter(a => a.activity_type === 'poo').length;
    const mealCount = periodActivities.filter(a => a.activity_type === 'meal').length;
    const walkCount = periodActivities.filter(a => a.activity_type === 'walk').length;
    const totalWalkMinutes = calculateTotalWalkMinutes(periodActivities);
    const avgWalkMinutes = totalWalkMinutes / daysInPeriod;

    return (
        <div className="space-y-4 p-4">
            <h2 className="text-xl font-bold text-center text-gray-700">{title}</h2>
            <p className="text-center text-gray-500 mb-4">Average daily activities</p>
            <StatCard
                icon={<Droplets size={32} className="text-blue-800" />}
                title="Avg Wee Breaks"
                value={`${(weeCount / daysInPeriod).toFixed(1)} / day`}
                color="bg-blue-100 text-blue-900"
            />
            <StatCard
                icon={<Droplet size={32} className="text-yellow-800" />}
                title="Avg Poo Breaks"
                value={`${(pooCount / daysInPeriod).toFixed(1)} / day`}
                color="bg-yellow-100 text-yellow-900"
            />
            <StatCard
                icon={<Soup size={32} className="text-red-800" />}
                title="Avg Meals"
                value={`${(mealCount / daysInPeriod).toFixed(1)} / day`}
                color="bg-red-100 text-red-900"
            />
            <StatCard
                icon={<Footprints size={32} className="text-green-800" />}
                title="Avg Walks"
                value={`${(walkCount / daysInPeriod).toFixed(1)} / day`}
                footer={`${Math.round(avgWalkMinutes)} min avg duration`}
                color="bg-green-100 text-green-900"
            />
        </div>
    );
};

export function Stats({ activities }: StatsProps) {
  const [view, setView] = useState<StatView>('day');

  return (
    <div className="pb-24">
        <div className="bg-white sticky top-0 z-10 p-2">
            <div className="flex justify-center rounded-lg bg-gray-200 p-1">
                <button onClick={() => setView('day')} className={`w-full py-2 text-sm font-medium rounded-md ${view === 'day' ? 'bg-white shadow' : 'text-gray-600'}`}>Day</button>
                <button onClick={() => setView('week')} className={`w-full py-2 text-sm font-medium rounded-md ${view === 'week' ? 'bg-white shadow' : 'text-gray-600'}`}>Week</button>
                <button onClick={() => setView('month')} className={`w-full py-2 text-sm font-medium rounded-md ${view === 'month' ? 'bg-white shadow' : 'text-gray-600'}`}>Month</button>
            </div>
        </div>

        {view === 'day' && <DayStats activities={activities} />}
        {view === 'week' && <PeriodStats activities={activities} period="week" />}
        {view === 'month' && <PeriodStats activities={activities} period="month" />}
    </div>
  );
}
