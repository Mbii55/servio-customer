// src/components/booking/CalendarPicker.tsx
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/colors';

interface CalendarPickerProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: Date[];
}

export const CalendarPicker: React.FC<CalendarPickerProps> = ({
  selectedDate,
  onDateSelect,
  minDate,
  maxDate,
  disabledDates = [],
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthName = currentMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const goToPreviousMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(currentMonth.getMonth() - 1);
    setCurrentMonth(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(currentMonth.getMonth() + 1);
    setCurrentMonth(newDate);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    return { daysInMonth, startDayOfWeek };
  };

  const isDateDisabled = (date: Date) => {
    const dateStr = date.toDateString();
    
    // Check if before minDate
    if (minDate && date < minDate) return true;
    
    // Check if after maxDate
    if (maxDate && date > maxDate) return true;
    
    // Check if in disabledDates array
    return disabledDates.some((d) => d.toDateString() === dateStr);
  };

  const isDateSelected = (date: Date) => {
    if (!selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const renderCalendar = () => {
    const { daysInMonth, startDayOfWeek } = getDaysInMonth(currentMonth);
    const days: (Date | null)[] = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        day
      );
      days.push(date);
    }

    return (
      <View style={styles.calendarGrid}>
        {days.map((date, index) => {
          if (!date) {
            return <View key={`empty-${index}`} style={styles.dayCell} />;
          }

          const disabled = isDateDisabled(date);
          const selected = isDateSelected(date);
          const today = isToday(date);

          return (
            <TouchableOpacity
              key={date.toISOString()}
              style={[
                styles.dayCell,
                selected && styles.dayCellSelected,
                disabled && styles.dayCellDisabled,
                today && !selected && styles.dayCellToday,
              ]}
              onPress={() => !disabled && onDateSelect(date)}
              disabled={disabled}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.dayText,
                  selected && styles.dayTextSelected,
                  disabled && styles.dayTextDisabled,
                  today && !selected && styles.dayTextToday,
                ]}
              >
                {date.getDate()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  // Check if we can go to previous month
  const canGoPrevious = useMemo(() => {
    if (!minDate) return true;
    const firstOfCurrentMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1
    );
    return firstOfCurrentMonth > minDate;
  }, [currentMonth, minDate]);

  return (
    <View style={styles.container}>
      {/* Month Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={goToPreviousMonth}
          disabled={!canGoPrevious}
          style={styles.navButton}
        >
          <Ionicons
            name="chevron-back"
            size={24}
            color={canGoPrevious ? COLORS.text.primary : COLORS.text.light}
          />
        </TouchableOpacity>
        <Text style={styles.monthText}>{monthName}</Text>
        <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
          <Ionicons name="chevron-forward" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Weekday Headers */}
      <View style={styles.weekdayRow}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <View key={day} style={styles.weekdayCell}>
            <Text style={styles.weekdayText}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Calendar Grid */}
      {renderCalendar()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background.primary,
    borderRadius: SIZES.radius,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  navButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthText: {
    fontSize: SIZES.body,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekdayText: {
    fontSize: SIZES.small,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  dayCellSelected: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  dayCellDisabled: {
    opacity: 0.3,
  },
  dayCellToday: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 8,
  },
  dayText: {
    fontSize: SIZES.body,
    color: COLORS.text.primary,
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  dayTextDisabled: {
    color: COLORS.text.light,
  },
  dayTextToday: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
});