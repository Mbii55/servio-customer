// src/components/booking/TimeSlotPicker.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/colors';

interface TimeSlot {
  time: string; // "09:00", "09:30", etc.
  available: boolean;
}

interface TimeSlotPickerProps {
  selectedTime: string | null; // "09:00"
  onTimeSelect: (time: string) => void;
  timeSlots?: TimeSlot[];
}

export const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({
  selectedTime,
  onTimeSelect,
  timeSlots = [],
}) => {
  // ✅ Just use what's passed, no fallback generation
  const slots = React.useMemo(() => {
    return timeSlots;
  }, [timeSlots]);

  // Group slots by time of day
  const groupedSlots = React.useMemo(() => {
    const morning: TimeSlot[] = [];
    const afternoon: TimeSlot[] = [];
    const evening: TimeSlot[] = [];

    slots.forEach((slot) => {
      const hour = parseInt(slot.time.split(':')[0]);
      if (hour < 12) {
        morning.push(slot);
      } else if (hour < 17) {
        afternoon.push(slot);
      } else {
        evening.push(slot);
      }
    });

    return { morning, afternoon, evening };
  }, [slots]);

  const formatTime = (time: string) => {
    const [hour, minute] = time.split(':');
    const hourNum = parseInt(hour);
    const period = hourNum >= 12 ? 'PM' : 'AM';
    const hour12 = hourNum > 12 ? hourNum - 12 : hourNum === 0 ? 12 : hourNum;
    return `${hour12}:${minute} ${period}`;
  };

  const renderTimeSlots = (slots: TimeSlot[], title: string) => {
    if (slots.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.slotsGrid}>
          {slots.map((slot) => {
            const isSelected = selectedTime === slot.time;
            const isDisabled = !slot.available;

            return (
              <TouchableOpacity
                key={slot.time}
                style={[
                  styles.timeSlot,
                  isSelected && styles.timeSlotSelected,
                  isDisabled && styles.timeSlotDisabled,
                ]}
                onPress={() => !isDisabled && onTimeSelect(slot.time)}
                disabled={isDisabled}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.timeText,
                    isSelected && styles.timeTextSelected,
                    isDisabled && styles.timeTextDisabled,
                  ]}
                >
                  {formatTime(slot.time)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Time</Text>
      {slots.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="time-outline" size={48} color={COLORS.text.light} />
          <Text style={styles.emptyText}>No available time slots</Text>
          <Text style={styles.emptySubtext}>
            The provider is not available on this date
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {renderTimeSlots(groupedSlots.morning, 'Morning')}
          {renderTimeSlots(groupedSlots.afternoon, 'Afternoon')}
          {renderTimeSlots(groupedSlots.evening, 'Evening')}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.secondary,
    marginBottom: 12,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeSlot: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.background.secondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: 100,
    alignItems: 'center',
  },
  timeSlotSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  timeSlotDisabled: {
    backgroundColor: '#f5f5f5',
    borderColor: '#e0e0e0',
    opacity: 0.5,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  timeTextSelected: {
    color: '#FFFFFF',
  },
  timeTextDisabled: {
    color: COLORS.text.light,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  emptySubtext: {
    marginTop: 6,
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
});