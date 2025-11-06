import { useState } from 'react';
import { Calendar } from '@/components/Calendar';

interface MultiDatePickerProps {
  selectedDates: Date[];
  onDateChange: (dates: Date[]) => void;
}

export function MultiDatePicker({ selectedDates, onDateChange }: MultiDatePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const handleDateSelect = (date: Date) => {
    const dateIndex = selectedDates.findIndex(d => d.toDateString() === date.toDateString());
    if (dateIndex > -1) {
      onDateChange(selectedDates.filter((_, i) => i !== dateIndex));
    } else {
      onDateChange([...selectedDates, date]);
    }
  };

  return (
    <div className="rounded-lg bg-white p-4 shadow-lg">
      <Calendar
        selectedDate={null}
        onDateSelect={handleDateSelect}
        activityDates={new Set(selectedDates.map(d => d.toDateString()))}
        onViewDay={() => {}}
        onAddActivityForDate={() => {}}
        currentMonth={currentMonth}
        setCurrentMonth={setCurrentMonth}
      />
    </div>
  );
}
