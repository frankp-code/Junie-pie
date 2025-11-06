import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface CalendarProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  activityDates: Set<string>;
  onViewDay: (date: Date) => void;
  onAddActivityForDate: (date: Date) => void;
  currentMonth?: Date;
  setCurrentMonth?: (date: Date) => void;
}

export function Calendar({ 
  selectedDate, 
  onDateSelect, 
  activityDates, 
  onViewDay, 
  onAddActivityForDate, 
  currentMonth: externalCurrentMonth,
  setCurrentMonth: setExternalCurrentMonth
}: CalendarProps) {
  const [internalCurrentMonth, setInternalCurrentMonth] = useState(selectedDate || new Date());

  const currentMonthDate = externalCurrentMonth || internalCurrentMonth;
  const setCurrentMonthDate = setExternalCurrentMonth || setInternalCurrentMonth;

  const currentMonth = currentMonthDate.getMonth();
  const currentYear = currentMonthDate.getFullYear();

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const goToPreviousMonth = () => {
    setCurrentMonthDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonthDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const goToToday = () => {
    const today = new Date();
    onDateSelect(today);
    setCurrentMonthDate(today);
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear()
    );
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return (
      day === selectedDate.getDate() &&
      currentMonth === selectedDate.getMonth() &&
      currentYear === selectedDate.getFullYear()
    );
  };

  const hasActivity = (day: number) => {
    const dateStr = new Date(currentYear, currentMonth, day).toDateString();
    return activityDates.has(dateStr);
  };

  const handleDayClick = (day: number) => {
    onDateSelect(new Date(currentYear, currentMonth, day));
  };
  
  const hasActivityOnSelectedDate = selectedDate && hasActivity(selectedDate.getDate());

  const days = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(<div key={`empty-${i}`} className="aspect-square" />);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const isCurrentDay = isToday(day);
    const dayDate = new Date(currentYear, currentMonth, day);
    const isSelectedDay = selectedDate ? isSelected(day) : activityDates.has(dayDate.toDateString());
    const hasActivityDay = hasActivity(day);

    days.push(
      <button
        key={day}
        onClick={() => handleDayClick(day)}
        className={`aspect-square rounded-lg font-medium transition-all relative ${
          isSelectedDay
            ? 'bg-pink-600 text-white shadow-md'
            : isCurrentDay
            ? 'bg-pink-100 text-pink-600 hover:bg-pink-200'
            : hasActivityDay && !selectedDate // Highlight activity days only when there is no single selected date
            ? 'bg-green-50 text-gray-900 hover:bg-green-100'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        {day}
        {hasActivityDay && !isSelectedDay && (
          <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-green-500 rounded-full" />
        )}
      </button>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">
          {monthNames[currentMonth]} {currentYear}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-gray-700 transition-colors"
          >
            Today
          </button>
          <button
            onClick={goToPreviousMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Next month"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-2">
        {dayNames.map((day) => (
          <div key={day} className="text-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">{days}</div>

      {selectedDate && (
        <div className="mt-6 text-center">
          {hasActivityOnSelectedDate ? (
            <button
              onClick={() => onViewDay(selectedDate)}
              className="bg-pink-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-pink-700 transition-colors"
            >
              View Activities for {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </button>
          ) : (
            <button
              onClick={() => onAddActivityForDate(selectedDate)}
              className="bg-pink-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-pink-700 transition-colors"
            >
              Add Activity for {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
