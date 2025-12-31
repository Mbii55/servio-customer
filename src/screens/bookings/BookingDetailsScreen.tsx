// src/screens/bookings/BookingDetailsScreen.tsx
import React, { useEffect, useState, useCallback  } from 'react';
import { useFocusEffect } from '@react-navigation/native';
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
import { LinearGradient } from 'expo-linear-gradient';

import { COLORS, SIZES } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { AuthModal } from '../../components/auth/AuthModal';
import { BookingStatus } from '../../services/bookings';
import api from '../../services/api';

// ✅ NEW: Import React Query hooks
import { useBooking, useCancelBooking, useCanReviewBooking } from '../../hooks/useBookings';

type Params = { bookingId: string };

const formatMoney = (value: any) => {
  const n = Number(value ?? 0);
  if (Number.isFinite(n)) return `${n.toFixed(0)}`;
  return `${value ?? ''}`;
};

const humanStatus = (s: string) => {
  const x = (s || '').replace('_', ' ');
  return x ? x.charAt(0).toUpperCase() + x.slice(1) : 'Unknown';
};

const statusConfig = (status: BookingStatus) => {
  switch (status) {
    case 'completed':
      return {
        colors: ['#10B981', '#059669'] as const,
        icon: 'checkmark-circle' as const,
        label: 'Completed',
      };
    case 'cancelled':
    case 'rejected':
      return {
        colors: ['#EF4444', '#DC2626'] as const,
        icon: 'close-circle' as const,
        label: status === 'cancelled' ? 'Cancelled' : 'Rejected',
      };
    case 'in_progress':
      return {
        colors: ['#8B5CF6', '#7C3AED'] as const,
        icon: 'play-circle' as const,
        label: 'In Progress',
      };
    case 'accepted':
      return {
        colors: [COLORS.primary, COLORS.secondary] as const,
        icon: 'checkmark-done' as const,
        label: 'Accepted',
      };
    case 'pending':
    default:
      return {
        colors: ['#F59E0B', '#D97706'] as const,
        icon: 'time' as const,
        label: 'Pending',
      };
  }
};

export const BookingDetailsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<Record<string, Params>, string>>();
  const { bookingId } = route.params;

  const { isAuthenticated, user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // ✅ NEW: React Query hooks - replaces manual state management!
  const {
    data: booking,
    isLoading: loading,
    error: queryError,
    refetch
  } = useBooking(bookingId, isAuthenticated);

  const cancelBookingMutation = useCancelBooking();

  // ✅ NEW: Check review eligibility with React Query
  const {
    data: reviewEligibility,
    isLoading: reviewLoading
  } = useCanReviewBooking(
    bookingId,
    isAuthenticated && !!booking && booking.status === 'completed'
  );

  const canReview = reviewEligibility?.canReview ?? false;

  const err = queryError ? 'Failed to load booking' : null;

  const status: BookingStatus = (booking?.status as BookingStatus) || 'pending';
  const config = statusConfig(status);

  const serviceTitle = booking?.service_title || booking?.service?.title || 'Service';
  const providerName =
    booking?.provider_business_name || booking?.provider?.business_profile?.business_name || 'Provider';
  const providerLogo = booking?.provider_business_logo || booking?.provider?.business_profile?.business_logo || null;

  const canCancel =
    (user?.role === 'customer' || user?.role === 'admin') &&
    (status === 'pending' || status === 'accepted');

  // ✅ IMPROVED: Optimistic cancel with automatic UI update
  const onCancel = () => {
    Alert.alert('Cancel Booking', 'Are you sure you want to cancel this booking?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelBookingMutation.mutateAsync({
              bookingId,
              reason: 'Cancelled by customer'
            });
            // React Query automatically updates the UI!
          } catch (e: any) {
            Alert.alert(
              'Error',
              e?.response?.data?.message || e?.message || 'Failed to cancel booking'
            );
          }
        },
      },
    ]);
  };

  const onGoToReview = () => {
    if (!booking) return;
    navigation.navigate('Review', {
      bookingId: booking.id,
      bookingNumber: booking.booking_number || booking.id,
      serviceTitle,
      providerName,
    });
  };

  // Derived states for review UI
  const isCompleted = status === 'completed';
  const alreadyReviewed = isCompleted && !canReview && !reviewLoading;

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={COLORS.primary} />
          <Text style={styles.loadingText}>Sign in to view booking details</Text>
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
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading booking details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (err || !booking) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <LinearGradient
            colors={['#FEF2F2', '#FEE2E2'] as const}
            style={styles.errorIconContainer}
          >
            <Ionicons name="alert-circle-outline" size={48} color={COLORS.danger} />
          </LinearGradient>
          <Text style={styles.errorTitle}>{err ?? 'Booking not found'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.secondary] as const}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.retryButtonGradient}
            >
              <Ionicons name="refresh" size={18} color="#FFF" />
              <Text style={styles.retryButtonText}>Try Again</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Booking Details</Text>
          <Text style={styles.headerSubtitle}>#{booking.booking_number || booking.id}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Banner */}
        <View style={styles.statusBanner}>
          <LinearGradient
            colors={config.colors as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.statusGradient}
          >
            <Ionicons name={config.icon} size={32} color="#FFF" />
            <View style={{ flex: 1 }}>
              <Text style={styles.statusLabel}>Status</Text>
              <Text style={styles.statusText}>{config.label}</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Service Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="briefcase" size={20} color={COLORS.primary} />
            <Text style={styles.cardHeaderText}>Service Details</Text>
          </View>

          <Text style={styles.serviceTitle}>{serviceTitle}</Text>

          <View style={styles.infoRow}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="calendar" size={14} color={COLORS.primary} />
            </View>
            <Text style={styles.infoText}>{booking.scheduled_date}</Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="time" size={14} color={COLORS.primary} />
            </View>
            <Text style={styles.infoText}>{booking.scheduled_time}</Text>
          </View>
        </View>

        {/* Provider Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="storefront" size={20} color="#F59E0B" />
            <Text style={styles.cardHeaderText}>Provider</Text>
          </View>

          <View style={styles.providerContainer}>
            {providerLogo ? (
              <Image source={{ uri: providerLogo }} style={styles.providerAvatar} />
            ) : (
              <LinearGradient
                colors={[COLORS.primary, COLORS.secondary] as const}
                style={styles.providerAvatarPlaceholder}
              >
                <Text style={styles.providerAvatarText}>
                  {providerName.charAt(0).toUpperCase()}
                </Text>
              </LinearGradient>
            )}

            <View style={{ flex: 1 }}>
              <Text style={styles.providerName}>{providerName}</Text>
              <Text style={styles.providerMeta}>Provider ID: {booking.provider_id}</Text>
            </View>
          </View>
        </View>

        {/* Address Card */}
        {booking.address && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="location" size={20} color="#10B981" />
              <Text style={styles.cardHeaderText}>Service Location</Text>
            </View>

            <View style={styles.addressContainer}>
              <Text style={styles.addressLabel}>{booking.address.label || 'Address'}</Text>
              <Text style={styles.addressText}>{booking.address.street_address}</Text>
              <Text style={styles.addressText}>
                {booking.address.city}, {booking.address.country}
              </Text>
            </View>
          </View>
        )}

        {/* Pricing Card */}
        <View style={styles.pricingCard}>
          <LinearGradient colors={['#F9FAFB', '#FFFFFF'] as const} style={styles.pricingGradient}>
            <View style={styles.cardHeader}>
              <Ionicons name="cash" size={20} color={COLORS.primary} />
              <Text style={styles.cardHeaderText}>Payment Details</Text>
            </View>

            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Service Price</Text>
              <Text style={styles.pricingValue}>QAR {formatMoney(booking.service_price)}</Text>
            </View>

            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Add-ons</Text>
              <Text style={styles.pricingValue}>QAR {formatMoney(booking.addons_price)}</Text>
            </View>

            <View style={styles.pricingDivider} />

            <View style={styles.pricingTotalRow}>
              <Text style={styles.pricingTotalLabel}>Total Amount</Text>
              <Text style={styles.pricingTotal}>QAR {formatMoney(booking.subtotal)}</Text>
            </View>

            <View style={styles.paymentMethodContainer}>
              <View style={styles.paymentMethod}>
                <Ionicons name="cash-outline" size={16} color="#10B981" />
                <Text style={styles.paymentMethodText}>
                  {(booking.payment_method || 'cash').toUpperCase()}
                </Text>
              </View>
              <View style={styles.paymentStatus}>
                <View
                  style={[
                    styles.paymentStatusDot,
                    { backgroundColor: booking.payment_status === 'paid' ? '#10B981' : '#F59E0B' },
                  ]}
                />
                <Text style={styles.paymentStatusText}>
                  {humanStatus(booking.payment_status || 'pending')}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Notes Card */}
        {(booking.customer_notes || booking.provider_notes || booking.cancellation_reason) && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="document-text" size={20} color="#8B5CF6" />
              <Text style={styles.cardHeaderText}>Notes</Text>
            </View>

            {booking.customer_notes && (
              <View style={styles.noteContainer}>
                <Text style={styles.noteLabel}>Customer Notes</Text>
                <Text style={styles.noteText}>{booking.customer_notes}</Text>
              </View>
            )}

            {booking.provider_notes && (
              <View style={styles.noteContainer}>
                <Text style={styles.noteLabel}>Provider Notes</Text>
                <Text style={styles.noteText}>{booking.provider_notes}</Text>
              </View>
            )}

            {booking.cancellation_reason && (
              <View style={[styles.noteContainer, styles.cancellationNote]}>
                <View style={styles.cancellationHeader}>
                  <Ionicons name="alert-circle" size={16} color={COLORS.danger} />
                  <Text style={styles.cancellationLabel}>Cancellation Reason</Text>
                </View>
                <Text style={styles.noteText}>{booking.cancellation_reason}</Text>
              </View>
            )}
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionsContainer}>
          {/* Review Section: Button, Badge, or Loader */}
          {isCompleted && (
            <View style={styles.reviewActionContainer}>
              {reviewLoading ? (
                <View style={styles.reviewLoading}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                  <Text style={styles.reviewLoadingText}>Checking review status...</Text>
                </View>
              ) : canReview ? (
                <TouchableOpacity
                  style={styles.reviewButton}
                  onPress={onGoToReview}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#F59E0B', '#D97706'] as const}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.reviewButtonGradient}
                  >
                    <Ionicons name="star" size={18} color="#FFF" />
                    <Text style={styles.reviewButtonText}>Write Review</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ) : alreadyReviewed ? (
                <View style={styles.reviewedBadge}>
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  <Text style={styles.reviewedBadgeText}>Reviewed</Text>
                </View>
              ) : null}
            </View>
          )}

          {canCancel && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCancel}
              disabled={cancelBookingMutation.isPending}
            >
              <View style={styles.cancelButtonContent}>
                {cancelBookingMutation.isPending ? (
                  <ActivityIndicator size="small" color={COLORS.danger} />
                ) : (
                  <Ionicons name="close-circle-outline" size={20} color={COLORS.danger} />
                )}
                <Text style={styles.cancelButtonText}>
                  {cancelBookingMutation.isPending ? 'Cancelling...' : 'Cancel Booking'}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },

  // Loading & Error
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  errorIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.danger,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  retryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 8,
  },
  retryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.text.secondary,
    marginTop: 2,
  },

  // Content
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },

  // Status Banner
  statusBanner: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  statusGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  statusLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  cardHeaderText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text.primary,
  },

  // Service
  serviceTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  infoIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    fontSize: 14,
    color: COLORS.text.primary,
    fontWeight: '600',
  },

  // Provider
  providerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  providerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  providerAvatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerAvatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  providerName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  providerMeta: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },

  // Address
  addressContainer: {
    gap: 4,
  },
  addressLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 20,
  },

  // Pricing
  pricingCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  pricingGradient: {
    padding: 16,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  pricingLabel: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  pricingValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  pricingDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  pricingTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  pricingTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  pricingTotal: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
  },
  paymentMethodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  paymentMethodText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
  },
  paymentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  paymentStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  paymentStatusText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },

  // Notes
  noteContainer: {
    marginBottom: 12,
  },
  noteLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 6,
  },
  noteText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 20,
  },
  cancellationNote: {
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  cancellationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  cancellationLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.danger,
  },

  // Cancel Button
  cancelButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.danger,
    overflow: 'hidden',
    marginTop: 8,
  },
  cancelButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.danger,
  },
  reviewActionContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },

  reviewLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 10,
  },
  reviewLoadingText: {
    color: COLORS.text.secondary,
    fontSize: 14,
  },

  // New: Reviewed badge (same style as in BookingsScreen)
  reviewedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 10,
  },
  reviewedBadgeText: {
    color: '#065F46',
    fontSize: 15,
    fontWeight: '600',
  },
  actionsContainer: { marginTop: 4 },

  reviewButton: { borderRadius: 16, overflow: 'hidden', marginTop: 10 },
  reviewButtonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  reviewButtonText: { color: '#FFF', fontWeight: '900', fontSize: 14 },
});