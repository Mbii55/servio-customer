// src/screens/bookings/BookingDetailsScreen.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import { COLORS, SIZES } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { AuthModal } from '../../components/auth/AuthModal';
import { cancelBooking, getBookingById, BookingStatus } from '../../services/bookings';

type Params = { bookingId: string };

const formatMoney = (value: any) => {
  const n = Number(value ?? 0);
  if (Number.isFinite(n)) return `QAR ${n.toFixed(2)}`;
  return `QAR ${value ?? ''}`;
};

const humanStatus = (s: string) => {
  const x = (s || '').replace('_', ' ');
  return x ? x.charAt(0).toUpperCase() + x.slice(1) : 'Unknown';
};

const badgeFor = (status: BookingStatus) => {
  switch (status) {
    case 'completed':
      return { bg: COLORS.success + '22', fg: COLORS.success, icon: 'checkmark-circle-outline' as const };
    case 'cancelled':
    case 'rejected':
      return { bg: COLORS.danger + '22', fg: COLORS.danger, icon: 'close-circle-outline' as const };
    case 'accepted':
    case 'in_progress':
      return { bg: COLORS.info + '22', fg: COLORS.info, icon: 'sync-outline' as const };
    case 'pending':
    default:
      return { bg: COLORS.warning + '22', fg: COLORS.warning, icon: 'time-outline' as const };
  }
};

export const BookingDetailsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<Record<string, Params>, string>>();
  const { bookingId } = route.params;

  const { isAuthenticated, user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [booking, setBooking] = useState<any | null>(null); // keep flexible (backend may add extra fields)

  const load = async () => {
    setErr(null);
    setLoading(true);
    try {
      const data = await getBookingById(bookingId);
      setBooking(data);
    } catch (e: any) {
      setErr(e?.response?.data?.message || e?.message || 'Failed to load booking');
      setBooking(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      setLoading(false);
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, bookingId]);

  const status: BookingStatus = (booking?.status as BookingStatus) || 'pending';
  const badge = badgeFor(status);

  const scheduledText = useMemo(() => {
    const d = booking?.scheduled_date;
    const t = booking?.scheduled_time;
    if (!d && !t) return '';
    return `${d ?? ''} • ${t ?? ''}`.trim();
  }, [booking?.scheduled_date, booking?.scheduled_time]);

  // these fields exist only if backend returns enriched booking
  const serviceTitle =
    booking?.service_title ||
    booking?.service?.title ||
    'Service';

  const providerName =
    booking?.provider_business_name ||
    booking?.provider?.business_name ||
    'Provider';

  const providerLogo =
    booking?.provider_business_logo ||
    booking?.provider?.business_logo ||
    null;

  const canCancel =
    (user?.role === 'customer' || user?.role === 'admin') &&
    (status === 'pending' || status === 'accepted' || status === 'in_progress');

  const onCancel = () => {
    Alert.alert(
      'Cancel booking?',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const updated = await cancelBooking(bookingId, 'Cancelled by customer');
              setBooking(updated);
            } catch (e: any) {
              Alert.alert(
                'Error',
                e?.response?.data?.message || e?.message || 'Failed to cancel booking'
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} />
          <Text style={styles.centerText}>Sign in to view booking details</Text>
        </View>

        <AuthModal
          visible={showAuthModal}
          onClose={() => {
            setShowAuthModal(false);
            navigation.goBack();
          }}
          initialMode="login"
        />
      </SafeAreaView>
    );
  }

  if (loading && !booking) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (err || !booking) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={44} color={COLORS.danger} />
          <Text style={[styles.centerText, { color: COLORS.danger }]}>
            {err ?? 'Booking not found'}
          </Text>

          <TouchableOpacity style={styles.primaryBtn} onPress={load} activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.85}>
          <Ionicons name="chevron-back" size={22} color={COLORS.text.primary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Booking Details</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: SIZES.padding, paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary */}
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.kicker}>Booking</Text>
            <View style={[styles.badge, { backgroundColor: badge.bg }]}>
              <Ionicons name={badge.icon} size={14} color={badge.fg} />
              <Text style={[styles.badgeText, { color: badge.fg }]}>
                {humanStatus(status)}
              </Text>
            </View>
          </View>

          <Text style={styles.big}>
            {booking.booking_number ? `#${booking.booking_number}` : booking.id}
          </Text>

          {!!scheduledText && (
            <View style={[styles.row, { marginTop: 10 }]}>
              <Ionicons name="calendar-outline" size={16} color={COLORS.text.secondary} />
              <Text style={styles.value}>{scheduledText}</Text>
            </View>
          )}
        </View>

        {/* Service */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Service</Text>
          <Text style={styles.big2} numberOfLines={2}>{serviceTitle}</Text>

          <View style={[styles.row, { marginTop: 10 }]}>
            <Ionicons name="cash-outline" size={16} color={COLORS.text.secondary} />
            <Text style={styles.value}>Total: {formatMoney(booking.subtotal)}</Text>
          </View>

          <View style={[styles.row, { marginTop: 8 }]}>
            <Ionicons name="wallet-outline" size={16} color={COLORS.text.secondary} />
            <Text style={styles.value}>
              Payment: {(booking.payment_method || 'cash').toUpperCase()} • {humanStatus(booking.payment_status || 'pending')}
            </Text>
          </View>
        </View>

        {/* Provider */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Provider</Text>

          <View style={[styles.row, { marginTop: 10 }]}>
            {providerLogo ? (
              <Image source={{ uri: providerLogo }} style={styles.providerLogo} />
            ) : (
              <View style={styles.providerLogoFallback}>
                <Ionicons name="storefront-outline" size={18} color={COLORS.text.light} />
              </View>
            )}

            <View style={{ flex: 1 }}>
              <Text style={styles.big2} numberOfLines={1}>{providerName}</Text>
              <Text style={styles.muted} numberOfLines={1}>
                Provider ID: {booking.provider_id}
              </Text>
            </View>
          </View>
        </View>

        {/* Breakdown */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Price Breakdown</Text>

          <View style={styles.rowBetweenLine}>
            <Text style={styles.muted}>Service</Text>
            <Text style={styles.valueStrong}>{formatMoney(booking.service_price)}</Text>
          </View>

          <View style={styles.rowBetweenLine}>
            <Text style={styles.muted}>Add-ons</Text>
            <Text style={styles.valueStrong}>{formatMoney(booking.addons_price)}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.rowBetweenLine}>
            <Text style={styles.valueStrong}>Total</Text>
            <Text style={styles.valueStrong}>{formatMoney(booking.subtotal)}</Text>
          </View>
        </View>

        {/* Notes */}
        {(booking.customer_notes || booking.provider_notes || booking.cancellation_reason) ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Notes</Text>

            {booking.customer_notes ? (
              <View style={{ marginTop: 10 }}>
                <Text style={styles.kicker}>Customer</Text>
                <Text style={styles.note}>{booking.customer_notes}</Text>
              </View>
            ) : null}

            {booking.provider_notes ? (
              <View style={{ marginTop: 10 }}>
                <Text style={styles.kicker}>Provider</Text>
                <Text style={styles.note}>{booking.provider_notes}</Text>
              </View>
            ) : null}

            {booking.cancellation_reason ? (
              <View style={{ marginTop: 10 }}>
                <Text style={styles.kicker}>Cancellation reason</Text>
                <Text style={styles.note}>{booking.cancellation_reason}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Actions */}
        {canCancel ? (
          <TouchableOpacity style={styles.dangerBtn} onPress={onCancel} activeOpacity={0.85}>
            <Text style={styles.dangerBtnText}>Cancel Booking</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background.primary },

  header: {
    paddingHorizontal: SIZES.padding,
    paddingTop: 10,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: SIZES.h4, fontWeight: '800', color: COLORS.text.primary },

  card: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: SIZES.radius,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },

  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  kicker: { fontSize: SIZES.tiny, color: COLORS.text.secondary, fontWeight: '700' },
  big: { marginTop: 8, fontSize: SIZES.h3, fontWeight: '900', color: COLORS.text.primary },
  big2: { fontSize: SIZES.body, fontWeight: '800', color: COLORS.text.primary },
  muted: { marginTop: 2, fontSize: SIZES.small, color: COLORS.text.secondary },

  value: { color: COLORS.text.secondary, fontSize: SIZES.body },
  valueStrong: { color: COLORS.text.primary, fontSize: SIZES.body, fontWeight: '800' },

  sectionTitle: { fontSize: SIZES.h4, fontWeight: '900', color: COLORS.text.primary },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: { fontSize: SIZES.tiny, fontWeight: '800' },

  rowBetweenLine: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  divider: { height: 1, backgroundColor: COLORS.border, marginTop: 12 },

  note: { marginTop: 6, fontSize: SIZES.body, color: COLORS.text.secondary, lineHeight: 22 },

  providerLogo: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.background.tertiary,
  },
  providerLogoFallback: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  primaryBtn: {
    marginTop: 10,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: SIZES.radius,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: SIZES.body, fontWeight: '800' },

  dangerBtn: {
    backgroundColor: COLORS.danger,
    paddingVertical: 14,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  dangerBtnText: { color: '#fff', fontSize: SIZES.body, fontWeight: '800' },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 18, gap: 10 },
  centerText: { color: COLORS.text.secondary, textAlign: 'center' },
});
