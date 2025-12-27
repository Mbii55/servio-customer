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
import { COLORS, SIZES } from '../../constants/colors';

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
        style={[styles.button, error && styles.buttonError]}
        onPress={() => setShow(true)}
      >
        <Ionicons
          name={mode === 'date' ? 'calendar-outline' : 'time-outline'}
          size={20}
          color={value ? COLORS.text.primary : COLORS.text.light}
        />
        <Text style={[styles.text, !value && styles.textPlaceholder]}>
          {formatValue()}
        </Text>
      </TouchableOpacity>
      {error && <Text style={styles.error}>{error}</Text>}

      {show && Platform.OS === 'ios' && (
        <Modal transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShow(false)}>
                  <Text style={styles.modalButton}>Done</Text>
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
    fontSize: SIZES.small,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.secondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radius,
    paddingHorizontal: 12,
    paddingVertical: 14,
    gap: 12,
  },
  buttonError: {
    borderColor: COLORS.danger,
  },
  text: {
    flex: 1,
    fontSize: SIZES.body,
    color: COLORS.text.primary,
  },
  textPlaceholder: {
    color: COLORS.text.light,
  },
  error: {
    fontSize: SIZES.small,
    color: COLORS.danger,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: COLORS.background.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalButton: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.primary,
  },
});