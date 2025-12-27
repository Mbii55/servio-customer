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
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../constants/colors';

interface TimeSlot {
  time: string;
  available: boolean;
}

interface TimeSlotPickerProps {
  selectedTime: string | null;
  onTimeSelect: (time: string) => void;
  timeSlots?: TimeSlot[];
}

export const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({
  selectedTime,
  onTimeSelect,
  timeSlots = [],
}) => {
  const slots = React.useMemo(() => {
    return timeSlots;
  }, [timeSlots]);

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

  const renderTimeSlots = (slots: TimeSlot[], title: string, icon: string) => {
    if (slots.length === 0) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconContainer}>
            <Ionicons name={icon as any} size={16} color={COLORS.primary} />
          </View>
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        
        <View style={styles.slotsGrid}>
          {slots.map((slot) => {
            const isSelected = selectedTime === slot.time;
            const isDisabled = !slot.available;

            return (
              <TouchableOpacity
                key={slot.time}
                style={styles.timeSlotWrapper}
                onPress={() => !isDisabled && onTimeSelect(slot.time)}
                disabled={isDisabled}
                activeOpacity={0.7}
              >
                {isSelected ? (
                  <LinearGradient
                    colors={[COLORS.primary, COLORS.secondary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.timeSlotSelected}
                  >
                    <Ionicons name="checkmark-circle" size={16} color="#FFF" />
                    <Text style={styles.timeTextSelected}>
                      {formatTime(slot.time)}
                    </Text>
                  </LinearGradient>
                ) : (
                  <View style={[
                    styles.timeSlot,
                    isDisabled && styles.timeSlotDisabled,
                  ]}>
                    <Text style={[
                      styles.timeText,
                      isDisabled && styles.timeTextDisabled,
                    ]}>
                      {formatTime(slot.time)}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  if (slots.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <LinearGradient
          colors={['#F9FAFB', '#F3F4F6']}
          style={styles.emptyIconContainer}
        >
          <Ionicons name="time-outline" size={48} color={COLORS.text.light} />
        </LinearGradient>
        <Text style={styles.emptyTitle}>No available slots</Text>
        <Text style={styles.emptySubtitle}>
          The provider is not available on this date
        </Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {renderTimeSlots(groupedSlots.morning, 'Morning', 'sunny')}
      {renderTimeSlots(groupedSlots.afternoon, 'Afternoon', 'partly-sunny')}
      {renderTimeSlots(groupedSlots.evening, 'Evening', 'moon')}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    maxHeight: 400,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeSlotWrapper: {
    width: '31%',
  },
  timeSlot: {
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  timeSlotSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 6,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  timeSlotDisabled: {
    backgroundColor: '#F9FAFB',
    opacity: 0.4,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  timeTextSelected: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  timeTextDisabled: {
    color: COLORS.text.light,
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
});