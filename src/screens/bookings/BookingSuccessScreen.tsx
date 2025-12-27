// src/screens/booking/BookingSuccessScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LottieView from 'lottie-react-native';

import { COLORS, SIZES } from '../../constants/colors';
import { Button } from '../../components/common/Button';
import { getBookingById } from '../../services/bookings';
import { Booking } from '../../types';

type Params = { bookingId: string };
type NavProp = NativeStackNavigationProp<any>;

export const BookingSuccessScreen: React.FC = () => {
  const route = useRoute<RouteProp<Record<string, Params>, string>>();
  const navigation = useNavigation<NavProp>();
  const { bookingId } = route.params;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBooking();
  }, [bookingId]);

  const loadBooking = async () => {
    try {
      const data = await getBookingById(bookingId);
      setBooking(data);
    } catch (error) {
      console.error('Failed to load booking:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeStr: string) => {
    const [hour, minute] = timeStr.split(':');
    const hourNum = parseInt(hour);
    const period = hourNum >= 12 ? 'PM' : 'AM';
    const hour12 = hourNum > 12 ? hourNum - 12 : hourNum === 0 ? 12 : hourNum;
    return `${hour12}:${minute} ${period}`;
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Success Animation/Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.successCircle}>
            <Ionicons name="checkmark" size={64} color="#FFFFFF" />
          </View>
        </View>

        {/* Success Message */}
        <Text style={styles.title}>Booking Confirmed!</Text>
        <Text style={styles.subtitle}>
          Your service has been booked successfully
        </Text>

        {/* Booking Details Card */}
        {booking && (
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Booking Number</Text>
              <Text style={styles.detailValue}>{booking.booking_number}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={20} color={COLORS.text.secondary} />
              <Text style={styles.detailText}>
                {formatDate(booking.scheduled_date)}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={20} color={COLORS.text.secondary} />
              <Text style={styles.detailText}>
                {formatTime(booking.scheduled_time)}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="cash-outline" size={20} color={COLORS.text.secondary} />
              <Text style={styles.detailText}>
                QAR {Number(booking.subtotal).toFixed(2)} (Cash on Service)
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.statusRow}>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>Pending Confirmation</Text>
              </View>
            </View>
          </View>
        )}

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={24} color={COLORS.info} />
          <Text style={styles.infoText}>
            The service provider will review your booking and confirm shortly. You'll receive a notification once confirmed.
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title="View Booking Details"
            onPress={() => {
              navigation.reset({
                index: 0,
                routes: [
                  { name: 'Bookings' },
                ],
              });
            }}
            variant="primary"
            style={styles.button}
          />

          <TouchableOpacity
            style={styles.homeButton}
            onPress={() => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Home' }],
              });
            }}
          >
            <Text style={styles.homeButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: SIZES.padding * 2,
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  successCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: SIZES.h1,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: SIZES.body,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  detailsCard: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: SIZES.radius,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  detailLabel: {
    fontSize: SIZES.small,
    color: COLORS.text.secondary,
    flex: 1,
  },
  detailValue: {
    fontSize: SIZES.body,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  detailText: {
    fontSize: SIZES.body,
    color: COLORS.text.primary,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },
  statusRow: {
    alignItems: 'center',
    marginTop: 8,
  },
  statusBadge: {
    backgroundColor: COLORS.warning + '20',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    fontSize: SIZES.small,
    fontWeight: '600',
    color: COLORS.warning,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.info + '15',
    padding: 16,
    borderRadius: SIZES.radius,
    gap: 12,
    marginBottom: 32,
  },
  infoText: {
    flex: 1,
    fontSize: SIZES.small,
    color: COLORS.info,
    lineHeight: 20,
  },
  actions: {
    gap: 12,
  },
  button: {
    marginBottom: 0,
  },
  homeButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  homeButtonText: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },
});