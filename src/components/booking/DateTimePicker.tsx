// src/components/booking/DateTimePicker.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../constants/colors';

interface DateTimePickerProps {
  label: string;
  value: Date | null;
  onChange: (date: Date) => void;
  mode: 'date' | 'time';
  error?: string;
  minimumDate?: Date;
}

export const DateTimePickerComponent: React.FC<DateTimePickerProps> = ({
  label,
  value,
  onChange,
  mode,
  error,
  minimumDate,
}) => {
  const [show, setShow] = useState(false);

  const handleChange = (_event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShow(false);
    }
    if (selectedDate) {
      onChange(selectedDate);
    }
  };

  const formatValue = () => {
    if (!value) return 'Select';
    if (mode === 'date') {
      return value.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }
    return value.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      
      <TouchableOpacity
        style={styles.button}
        onPress={() => setShow(true)}
        activeOpacity={0.7}
      >
        {error ? (
          <View style={styles.buttonError}>
            <View style={styles.iconContainer}>
              <Ionicons
                name={mode === 'date' ? 'calendar' : 'time'}
                size={18}
                color={COLORS.danger}
              />
            </View>
            <Text style={[styles.text, !value && styles.textPlaceholder]}>
              {formatValue()}
            </Text>
          </View>
        ) : value ? (
          <LinearGradient
            colors={['#EFF6FF', '#DBEAFE']}
            style={styles.buttonFilled}
          >
            <View style={styles.iconContainer}>
              <Ionicons
                name={mode === 'date' ? 'calendar' : 'time'}
                size={18}
                color={COLORS.primary}
              />
            </View>
            <Text style={styles.text}>{formatValue()}</Text>
          </LinearGradient>
        ) : (
          <View style={styles.buttonEmpty}>
            <View style={styles.iconContainer}>
              <Ionicons
                name={mode === 'date' ? 'calendar-outline' : 'time-outline'}
                size={18}
                color={COLORS.text.light}
              />
            </View>
            <Text style={styles.textPlaceholder}>{formatValue()}</Text>
          </View>
        )}
      </TouchableOpacity>

      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={14} color={COLORS.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {show && Platform.OS === 'ios' && (
        <Modal transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity 
                  onPress={() => setShow(false)}
                  style={styles.doneButton}
                >
                  <LinearGradient
                    colors={[COLORS.primary, COLORS.secondary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.doneButtonGradient}
                  >
                    <Text style={styles.doneButtonText}>Done</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={value || new Date()}
                mode={mode}
                display="spinner"
                onChange={handleChange}
                minimumDate={minimumDate}
              />
            </View>
          </View>
        </Modal>
      )}

      {show && Platform.OS === 'android' && (
        <DateTimePicker
          value={value || new Date()}
          mode={mode}
          display="default"
          onChange={handleChange}
          minimumDate={minimumDate}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 10,
  },
  button: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonFilled: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  buttonEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 12,
  },
  buttonError: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: COLORS.danger,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  textPlaceholder: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text.light,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  errorText: {
    fontSize: 13,
    color: COLORS.danger,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34,
  },
  modalHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    alignItems: 'flex-end',
  },
  doneButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  doneButtonGradient: {
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  doneButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});