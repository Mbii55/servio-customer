// src/screens/bookings/BookingsScreen.tsx
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { AuthModal } from '../../components/auth/AuthModal';
import { COLORS } from '../../constants/colors';
import { Booking } from '../../types';

// ✅ React Query hooks
import {
  useBookings,
  useBookingsReviewEligibility,
  usePrefetchBooking,
} from '../../hooks/useBookings';

type BookingStatus =
  | 'pending'
  | 'accepted'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'rejected';

type BookingWithDetails = Booking & {
  service_title?: string | null;
  provider_business_name?: string | null;
  provider_business_logo?: string | null;
};

type TabKey = 'All' | 'Upcoming' | 'Completed' | 'Cancelled';

export const BookingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { isAuthenticated } = useAuth();

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('All');

  const {
    data: bookingsData,
    isLoading: loading,
    error: queryError,
    refetch,
  } = useBookings();

  const bookings = useMemo(() => {
    return Array.isArray(bookingsData) ? (bookingsData as BookingWithDetails[]) : [];
  }, [bookingsData]);

  const completedBookingIds = useMemo(() => {
    return bookings
      .filter((b) => (b.status as BookingStatus) === 'completed')
      .map((b) => b.id);
  }, [bookings]);

  const { data: reviewEligibilityMap = {} } = useBookingsReviewEligibility(
    completedBookingIds,
    isAuthenticated && completedBookingIds.length > 0
  );

  const prefetchBooking = usePrefetchBooking();

  const err = queryError ? 'Failed to load bookings' : null;

  const filtered = useMemo(() => {
    const list = bookings || [];

    const statusOf = (b: BookingWithDetails): BookingStatus =>
      (b.status as BookingStatus) || 'pending';

    if (activeTab === 'All') return list;

    if (activeTab === 'Upcoming') {
      return list.filter((b) => {
        const s = statusOf(b);
        return s === 'pending' || s === 'accepted' || s === 'in_progress';
      });
    }

    if (activeTab === 'Completed') {
      return list.filter((b) => statusOf(b) === 'completed');
    }

    return list.filter((b) => {
      const s = statusOf(b);
      return s === 'cancelled' || s === 'rejected';
    });
  }, [bookings, activeTab]);

  const formatMoney = (value: any) => {
    const n = Number(value ?? 0);
    if (Number.isFinite(n)) return `${n.toFixed(0)}`;
    return `${value ?? ''}`;
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

  const countText = useMemo(() => {
    if (!isAuthenticated) return '';
    if (loading) return 'Loading your bookings...';
    if (err) return 'Something went wrong';
    return filtered.length ? `${filtered.length} bookings` : 'No bookings here yet';
  }, [isAuthenticated, loading, err, filtered.length]);

  const handleRefresh = async () => {
    await refetch();
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>My Bookings</Text>
            <Text style={styles.headerSubtitle}>Track your services</Text>
          </View>
        </View>

        <View style={styles.emptyContainer}>
          <LinearGradient colors={['#EFF6FF', '#DBEAFE']} style={styles.emptyIconContainer}>
            <Ionicons name="calendar-outline" size={48} color={COLORS.primary} />
          </LinearGradient>

          <Text style={styles.emptyTitle}>Sign in to view bookings</Text>
          <Text style={styles.emptySubtitle}>
            Track your upcoming services and view your complete booking history
          </Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setShowAuthModal(true)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>Sign In</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <AuthModal
          visible={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          initialMode="login"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>My Bookings</Text>
          <Text style={styles.headerSubtitle}>{countText}</Text>
        </View>

        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh} activeOpacity={0.7}>
          <Ionicons name="refresh" size={22} color={COLORS.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScroll}
        >
          {(['All', 'Upcoming', 'Completed', 'Cancelled'] as TabKey[]).map((tab) => {
            const active = tab === activeTab;

            const count = bookings.filter((b) => {
              const status = (b.status as BookingStatus) || 'pending';

              if (tab === 'All') return true;
              if (tab === 'Upcoming') return ['pending', 'accepted', 'in_progress'].includes(status);
              if (tab === 'Completed') return status === 'completed';
              return ['cancelled', 'rejected'].includes(status);
            }).length;

            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.8}
                style={[styles.tabPill, active ? styles.tabPillActive : styles.tabPillInactive]}
              >
                {active ? (
                  <LinearGradient
                    colors={[COLORS.primary, COLORS.secondary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.tabPillGradient}
                  >
                    <Text style={styles.tabLabelActive} numberOfLines={1}>
                      {tab}
                    </Text>

                    <View style={styles.tabCountActive}>
                      <Text style={styles.tabCountTextActive}>{count}</Text>
                    </View>
                  </LinearGradient>
                ) : (
                  <View style={styles.tabPillInner}>
                    <Text style={styles.tabLabelInactive} numberOfLines={1}>
                      {tab}
                    </Text>

                    <View style={styles.tabCountInactive}>
                      <Text style={styles.tabCountTextInactive}>{count}</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>


      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {loading && bookings.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading bookings...</Text>
          </View>
        ) : err ? (
          <View style={styles.emptyContainer}>
            <LinearGradient colors={['#FEF2F2', '#FEE2E2']} style={styles.emptyIconContainer}>
              <Ionicons name="alert-circle-outline" size={48} color={COLORS.danger} />
            </LinearGradient>

            <Text style={[styles.emptyTitle, { color: COLORS.danger }]}>{err}</Text>

            <TouchableOpacity style={styles.retryButton} onPress={handleRefresh} activeOpacity={0.8}>
              <Ionicons name="refresh" size={18} color={COLORS.primary} />
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyContainer}>
            <LinearGradient colors={['#EFF6FF', '#DBEAFE']} style={styles.emptyIconContainer}>
              <Ionicons name="calendar-outline" size={48} color={COLORS.primary} />
            </LinearGradient>

            <Text style={styles.emptyTitle}>
              {activeTab === 'All' ? 'No bookings yet' : `No ${activeTab.toLowerCase()} bookings`}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'Upcoming'
                ? 'Book a service to get started'
                : activeTab === 'All'
                  ? 'Once you book a service, it will appear here'
                  : `You don't have any ${activeTab.toLowerCase()} bookings yet`}
            </Text>

            {(activeTab === 'Upcoming' || activeTab === 'All') && (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => navigation.navigate('Home')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[COLORS.primary, COLORS.secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.buttonText}>Browse Services</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFF" />
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.bookingsList}>
            {filtered.map((booking) => {
              const status = (booking.status as BookingStatus) || 'pending';
              const config = statusConfig(status);

              const isCompleted = status === 'completed';
              const canReview = reviewEligibilityMap[booking.id] === true;
              const alreadyReviewed = isCompleted && reviewEligibilityMap[booking.id] === false;

              return (
                <TouchableOpacity
                  key={booking.id}
                  style={styles.bookingCard}
                  activeOpacity={0.85}
                  onPress={() => {
                    prefetchBooking(booking.id);
                    navigation.navigate('BookingDetails', { bookingId: booking.id });
                  }}
                >
                  <View style={styles.cardBody}>
                    {/* Header */}
                    <View style={styles.cardHeader}>
                      <View style={styles.providerInfo}>
                        {booking.provider_business_logo ? (
                          <Image
                            source={{ uri: booking.provider_business_logo }}
                            style={styles.providerAvatar}
                          />
                        ) : (
                          <View style={styles.providerAvatarPlaceholder}>
                            <Ionicons name="storefront" size={20} color={COLORS.primary} />
                          </View>
                        )}

                        <View style={styles.providerDetails}>
                          <Text style={styles.serviceName} numberOfLines={1}>
                            {booking.service_title || 'Service'}
                          </Text>
                          <View style={styles.providerNameContainer}>
                            <Ionicons name="business" size={11} color={COLORS.text.secondary} />
                            <Text style={styles.providerName} numberOfLines={1}>
                              {booking.provider_business_name || 'Provider'}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Status Badge */}
                      <View style={styles.statusBadge}>
                        <LinearGradient
                          colors={config.colors}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.statusGradient}
                        >
                          <Ionicons name={config.icon} size={12} color="#FFF" />
                          <Text style={styles.statusText}>{config.label}</Text>
                        </LinearGradient>
                      </View>
                    </View>

                    {/* Details (vertical to avoid overflow) */}
                    <View style={styles.detailsColumn}>
                      <View style={styles.detailRow}>
                        <View style={styles.detailIconContainer}>
                          <Ionicons name="calendar" size={14} color={COLORS.primary} />
                        </View>
                        <Text style={styles.detailText}>{booking.scheduled_date}</Text>
                      </View>

                      <View style={styles.detailRow}>
                        <View style={styles.detailIconContainer}>
                          <Ionicons name="time" size={14} color={COLORS.primary} />
                        </View>
                        <Text style={styles.detailText}>{booking.scheduled_time}</Text>
                      </View>

                      <View style={styles.detailRow}>
                        <View style={styles.detailIconContainer}>
                          <Ionicons name="cash" size={14} color={COLORS.primary} />
                        </View>
                        <Text style={styles.detailTextBold}>QAR {formatMoney(booking.subtotal)}</Text>
                      </View>
                    </View>

                    {/* Footer */}
                    <View style={styles.cardFooter}>
                      <Text style={styles.bookingNumber}>#{booking.booking_number}</Text>

                      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                        {isCompleted && canReview && (
                          <TouchableOpacity
                            style={styles.reviewButton}
                            onPress={(e) => {
                              e.stopPropagation();
                              navigation.navigate('Review', {
                                bookingId: booking.id,
                                bookingNumber: booking.booking_number,
                                serviceTitle: booking.service_title || 'Service',
                                providerName: booking.provider_business_name || 'Provider',
                              });
                            }}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="star" size={14} color="#F59E0B" />
                            <Text style={styles.reviewButtonText}>Review</Text>
                          </TouchableOpacity>
                        )}


                        <View style={styles.viewDetailsButton}>
                          <Text style={styles.viewDetailsText}>View Details</Text>
                          <Ionicons name="arrow-forward" size={14} color={COLORS.primary} />
                        </View>
                      </View>
                    </View>

                    {/* Chevron */}
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={COLORS.text.light}
                      style={styles.chevron}
                    />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#111827' },
  headerSubtitle: { fontSize: 14, color: '#6B7280', marginTop: 2 },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  tabsWrap: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 12,
  },
  tabsScroll: {
    paddingHorizontal: 16,
    gap: 10,
  },

  tabPill: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  tabPillActive: {
    // gradient handles bg
  },
  tabPillInactive: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  tabPillGradient: {
    height: 40,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minWidth: 108, // ✅ prevents wrapping (Completed)
  },
  tabPillInner: {
    height: 40,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minWidth: 108, // ✅ same width as active
  },

  tabLabelActive: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  tabLabelInactive: {
    fontSize: 13,
    fontWeight: '800',
    color: '#6B7280',
  },

  tabCountActive: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  tabCountTextActive: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  tabCountInactive: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  tabCountTextInactive: {
    fontSize: 12,
    fontWeight: '900',
    color: '#6B7280',
  },


  scrollContent: { flexGrow: 1, paddingBottom: 200 },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: { marginTop: 12, fontSize: 14, color: '#6B7280' },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  primaryButton: { width: '100%', borderRadius: 12, overflow: 'hidden' },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 8,
  },
  buttonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
  },
  retryButtonText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },

  bookingsList: { padding: 16, gap: 12 },

  // ✅ Enhanced card (NO left status bar)
  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EEF2F7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardBody: { padding: 16 },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  providerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  providerAvatar: { width: 48, height: 48, borderRadius: 12, marginRight: 12 },
  providerAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  providerDetails: { flex: 1 },
  serviceName: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 4 },
  providerNameContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  providerName: { fontSize: 13, color: '#6B7280', fontWeight: '600' },

  statusBadge: { borderRadius: 999, overflow: 'hidden' },
  statusGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 6,
  },
  statusText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },

  // ✅ Vertical details to prevent overflow
  detailsColumn: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 10,
  },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailIconContainer: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailText: { fontSize: 13, color: '#6B7280', fontWeight: '600' },
  detailTextBold: { fontSize: 14, fontWeight: '800', color: '#111827' },

  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  bookingNumber: { fontSize: 13, fontWeight: '600', color: '#6B7280' },

  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  reviewButtonText: { fontSize: 12, fontWeight: '800', color: '#F59E0B' },

  reviewedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#D1FAE5',
    borderRadius: 10,
  },
  reviewedBadgeText: { fontSize: 12, fontWeight: '800', color: '#10B981' },

  viewDetailsButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewDetailsText: { fontSize: 13, fontWeight: '800', color: COLORS.primary },

  chevron: {
    position: 'absolute',
    right: 14,
    top: 18,
    opacity: 0.65,
  },
});
