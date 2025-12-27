// src/screens/bookings/BookingsScreen.tsx
import React, { useEffect, useMemo, useState } from 'react';
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
import { COLORS, SIZES } from '../../constants/colors';

import { getMyBookings } from '../../services/bookings';
import { Booking } from '../../types';

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

type TabKey = 'Upcoming' | 'Completed' | 'Cancelled';

export const BookingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { isAuthenticated } = useAuth();

  const [showAuthModal, setShowAuthModal] = useState(false);

  const [activeTab, setActiveTab] = useState<TabKey>('Upcoming');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);

  const loadBookings = async () => {
    setErr(null);
    setLoading(true);
    try {
      const data = await getMyBookings();
      setBookings(Array.isArray(data) ? (data as BookingWithDetails[]) : []);
    } catch (e: any) {
      setErr(e?.response?.data?.message || e?.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setErr(null);
    setRefreshing(true);
    try {
      const data = await getMyBookings();
      setBookings(Array.isArray(data) ? (data as BookingWithDetails[]) : []);
    } catch (e: any) {
      setErr(e?.response?.data?.message || e?.message || 'Failed to load bookings');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    loadBookings();
  }, [isAuthenticated]);

  const filtered = useMemo(() => {
    const list = bookings || [];

    const statusOf = (b: BookingWithDetails): BookingStatus =>
      (b.status as BookingStatus) || 'pending';

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

  const formatStatus = (s: string) => {
    const x = (s || '').replace('_', ' ');
    return x.charAt(0).toUpperCase() + x.slice(1);
  };

  const statusConfig = (status: BookingStatus) => {
    switch (status) {
      case 'completed':
        return { 
          colors: ['#10B981', '#059669'] as const,
          icon: 'checkmark-circle' as const,
          label: 'Completed'
        };
      case 'cancelled':
      case 'rejected':
        return { 
          colors: ['#EF4444', '#DC2626'] as const,
          icon: 'close-circle' as const,
          label: status === 'cancelled' ? 'Cancelled' : 'Rejected'
        };
      case 'in_progress':
        return { 
          colors: ['#8B5CF6', '#7C3AED'] as const,
          icon: 'play-circle' as const,
          label: 'In Progress'
        };
      case 'accepted':
        return { 
          colors: [COLORS.primary, COLORS.secondary] as const,
          icon: 'checkmark-done' as const,
          label: 'Accepted'
        };
      case 'pending':
      default:
        return { 
          colors: ['#F59E0B', '#D97706'] as const,
          icon: 'time' as const,
          label: 'Pending'
        };
    }
  };

  const countText = useMemo(() => {
    if (!isAuthenticated) return '';
    if (loading) return 'Loading your bookings...';
    if (err) return 'Something went wrong';
    return filtered.length ? `${filtered.length} bookings` : 'No bookings here yet';
  }, [isAuthenticated, loading, err, filtered.length]);

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>My Bookings</Text>
            <Text style={styles.headerSubtitle}>Track your services</Text>
          </View>
        </View>

        {/* Guest State */}
        <View style={styles.emptyContainer}>
          <LinearGradient
            colors={['#EFF6FF', '#DBEAFE']}
            style={styles.emptyIconContainer}
          >
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

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onRefresh}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh" size={22} color={COLORS.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {(['Upcoming', 'Completed', 'Cancelled'] as TabKey[]).map((tab) => {
          const active = tab === activeTab;
          const count = bookings.filter(b => {
            const status = (b.status as BookingStatus) || 'pending';
            if (tab === 'Upcoming') {
              return ['pending', 'accepted', 'in_progress'].includes(status);
            }
            if (tab === 'Completed') {
              return status === 'completed';
            }
            return ['cancelled', 'rejected'].includes(status);
          }).length;

          return (
            <TouchableOpacity
              key={tab}
              style={styles.tab}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.7}
            >
              {active ? (
                <LinearGradient
                  colors={[COLORS.primary, COLORS.secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.tabActive}
                >
                  <Text style={styles.tabTextActive}>{tab}</Text>
                  {count > 0 && (
                    <View style={styles.tabBadge}>
                      <Text style={styles.tabBadgeText}>{count}</Text>
                    </View>
                  )}
                </LinearGradient>
              ) : (
                <View style={styles.tabInactive}>
                  <Text style={styles.tabTextInactive}>{tab}</Text>
                  {count > 0 && (
                    <View style={styles.tabBadgeInactive}>
                      <Text style={styles.tabBadgeTextInactive}>{count}</Text>
                    </View>
                  )}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading bookings...</Text>
          </View>
        ) : err ? (
          <View style={styles.emptyContainer}>
            <LinearGradient
              colors={['#FEF2F2', '#FEE2E2']}
              style={styles.emptyIconContainer}
            >
              <Ionicons name="alert-circle-outline" size={48} color={COLORS.danger} />
            </LinearGradient>
            
            <Text style={[styles.emptyTitle, { color: COLORS.danger }]}>{err}</Text>
            
            <TouchableOpacity
              style={styles.retryButton}
              onPress={loadBookings}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh" size={18} color={COLORS.primary} />
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyContainer}>
            <LinearGradient
              colors={['#EFF6FF', '#DBEAFE']}
              style={styles.emptyIconContainer}
            >
              <Ionicons name="calendar-outline" size={48} color={COLORS.primary} />
            </LinearGradient>
            
            <Text style={styles.emptyTitle}>No {activeTab.toLowerCase()} bookings</Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'Upcoming'
                ? 'Book a service to get started'
                : `You don't have any ${activeTab.toLowerCase()} bookings yet`}
            </Text>

            {activeTab === 'Upcoming' && (
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

              return (
                <TouchableOpacity
                  key={booking.id}
                  style={styles.bookingCard}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate('BookingDetails', { bookingId: booking.id })}
                >
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

                  {/* Details */}
                  <View style={styles.cardDetails}>
                    <View style={styles.detailItem}>
                      <View style={styles.detailIconContainer}>
                        <Ionicons name="calendar" size={14} color={COLORS.primary} />
                      </View>
                      <Text style={styles.detailText}>{booking.scheduled_date}</Text>
                    </View>

                    <View style={styles.detailItem}>
                      <View style={styles.detailIconContainer}>
                        <Ionicons name="time" size={14} color={COLORS.primary} />
                      </View>
                      <Text style={styles.detailText}>{booking.scheduled_time}</Text>
                    </View>

                    <View style={styles.detailItem}>
                      <View style={styles.detailIconContainer}>
                        <Ionicons name="cash" size={14} color={COLORS.primary} />
                      </View>
                      <Text style={styles.detailTextBold}>
                        QAR {formatMoney(booking.subtotal)}
                      </Text>
                    </View>
                  </View>

                  {/* Footer */}
                  <View style={styles.cardFooter}>
                    <Text style={styles.bookingNumber}>#{booking.booking_number}</Text>
                    
                    <View style={styles.viewDetailsButton}>
                      <Text style={styles.viewDetailsText}>View Details</Text>
                      <Ionicons name="arrow-forward" size={14} color={COLORS.primary} />
                    </View>
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
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
    fontWeight: '500',
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 10,
    backgroundColor: '#FFFFFF',
  },
  tab: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  tabActive: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  tabInactive: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
  },
  tabTextActive: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tabTextInactive: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text.secondary,
  },
  tabBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 20,
    alignItems: 'center',
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  tabBadgeInactive: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 20,
    alignItems: 'center',
  },
  tabBadgeTextInactive: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.text.secondary,
  },

  // Scroll
  scrollContent: {
    paddingBottom: 120,
  },

  // Loading
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },

  // Empty States
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },

  // Buttons
  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 8,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    gap: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },

  // Bookings List
  bookingsList: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },

  // Booking Card
  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },

  // Card Header
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  providerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginRight: 12,
  },
  providerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  providerAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerDetails: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  providerNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  providerName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },

  // Status Badge
  statusBadge: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  statusGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Card Details
  cardDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  detailIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },
  detailTextBold: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
  },

  // Card Footer
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  bookingNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text.light,
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewDetailsText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
});