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
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    if (Number.isFinite(n)) return `QAR ${n.toFixed(2)}`;
    return `QAR ${value ?? ''}`;
  };

  const formatStatus = (s: string) => {
    const x = (s || '').replace('_', ' ');
    return x.charAt(0).toUpperCase() + x.slice(1);
  };

  const statusColors = (status: BookingStatus) => {
    switch (status) {
      case 'completed':
        return { bg: 'rgba(52,199,89,0.14)', fg: COLORS.success, icon: 'checkmark-circle' as const };
      case 'cancelled':
      case 'rejected':
        return { bg: 'rgba(255,59,48,0.14)', fg: COLORS.danger, icon: 'close-circle' as const };
      case 'accepted':
      case 'in_progress':
        return { bg: 'rgba(0,122,255,0.14)', fg: COLORS.info, icon: 'time' as const };
      case 'pending':
      default:
        return { bg: 'rgba(255,149,0,0.14)', fg: COLORS.warning, icon: 'hourglass' as const };
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
            <Text style={styles.title}>Bookings</Text>
            <Text style={styles.subTitle}>Track your orders and history</Text>
          </View>
        </View>

        {/* Guest */}
        <View style={styles.stateWrap}>
          <View style={styles.stateIcon}>
            <Ionicons name="calendar-outline" size={30} color={COLORS.primary} />
          </View>
          <Text style={styles.stateTitle}>Sign in to view bookings</Text>
          <Text style={styles.stateText}>
            Sign in to track upcoming services and view your booking history.
          </Text>

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => setShowAuthModal(true)}
            activeOpacity={0.9}
          >
            <Text style={styles.primaryBtnText}>Sign in</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
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
          <Text style={styles.title}>Bookings</Text>
          <Text style={styles.subTitle}>{countText}</Text>
        </View>

        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => {
            setRefreshing(true);
            onRefresh().finally(() => setRefreshing(false));
          }}
          activeOpacity={0.9}
        >
          <Ionicons name="refresh-outline" size={20} color={COLORS.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Segmented tabs */}
      <View style={styles.tabsWrap}>
        {(['Upcoming', 'Completed', 'Cancelled'] as TabKey[]).map((tab) => {
          const active = tab === activeTab;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tabPill, active && styles.tabPillActive]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.9}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 18 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Loading / Error / Empty / List */}
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator color={COLORS.primary} />
            <Text style={styles.centerText}>Loading bookings...</Text>
          </View>
        ) : err ? (
          <View style={styles.centerBox}>
            <View style={[styles.stateIcon, { backgroundColor: 'rgba(255,59,48,0.12)' }]}>
              <Ionicons name="alert-circle-outline" size={26} color={COLORS.danger} />
            </View>
            <Text style={[styles.centerText, { color: COLORS.danger, fontWeight: '800' }]}>{err}</Text>

            <TouchableOpacity style={styles.primaryBtn} onPress={loadBookings} activeOpacity={0.9}>
              <Text style={styles.primaryBtnText}>Retry</Text>
              <Ionicons name="refresh" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : filtered.length === 0 ? (
          <View style={[styles.stateWrap, { paddingTop: 22 }]}>
            <View style={styles.stateIcon}>
              <Ionicons name="calendar-outline" size={30} color={COLORS.primary} />
            </View>
            <Text style={styles.stateTitle}>No {activeTab.toLowerCase()} bookings</Text>
            <Text style={styles.stateText}>
              {activeTab === 'Upcoming'
                ? `When you book a service, you'll see it here.`
                : `You don't have any ${activeTab.toLowerCase()} bookings yet.`}
            </Text>

            {activeTab === 'Upcoming' && (
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => navigation.navigate('Home')}
                activeOpacity={0.9}
              >
                <Text style={styles.primaryBtnText}>Browse services</Text>
                <Ionicons name="arrow-forward" size={16} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.listWrap}>
            {filtered.map((b) => {
              const status = (b.status as BookingStatus) || 'pending';
              const c = statusColors(status);

              const serviceName = b.service_title || 'Service';
              const providerName = b.provider_business_name || 'Provider';

              return (
                <TouchableOpacity
                  key={b.id}
                  style={styles.bookingCard}
                  activeOpacity={0.92}
                  onPress={() => navigation.navigate('BookingDetails', { bookingId: b.id })}
                >
                  {/* top row */}
                  <View style={styles.cardTopRow}>
                    <View style={styles.providerAvatar}>
                      {b.provider_business_logo ? (
                        <Image source={{ uri: b.provider_business_logo }} style={styles.avatarImg} />
                      ) : (
                        <Ionicons name="storefront-outline" size={18} color={COLORS.text.secondary} />
                      )}
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.bookingTitle} numberOfLines={1}>
                        {serviceName}
                      </Text>
                      <Text style={styles.providerName} numberOfLines={1}>
                        {providerName}
                      </Text>
                    </View>

                    <View style={[styles.statusBadge, { backgroundColor: c.bg }]}>
                      <Ionicons name={c.icon} size={14} color={c.fg} />
                      <Text style={[styles.statusText, { color: c.fg }]}>{formatStatus(status)}</Text>
                    </View>
                  </View>

                  {/* detail chips */}
                  <View style={styles.chipsRow}>
                    <View style={styles.chip}>
                      <Ionicons name="calendar-outline" size={14} color={COLORS.text.secondary} />
                      <Text style={styles.chipText} numberOfLines={1}>
                        {b.scheduled_date}
                      </Text>
                    </View>

                    <View style={styles.chip}>
                      <Ionicons name="time-outline" size={14} color={COLORS.text.secondary} />
                      <Text style={styles.chipText} numberOfLines={1}>
                        {b.scheduled_time}
                      </Text>
                    </View>

                    <View style={styles.chipStrong}>
                      <Ionicons name="cash-outline" size={14} color={COLORS.primary} />
                      <Text style={styles.chipStrongText} numberOfLines={1}>
                        {formatMoney(b.subtotal)}
                      </Text>
                    </View>
                  </View>

                  {/* bottom row */}
                  <View style={styles.cardBottomRow}>
                    <Text style={styles.bookingNumber}>Booking #{b.booking_number}</Text>

                    <View style={styles.viewDetailsRow}>
                      <Text style={styles.viewDetails}>View details</Text>
                      <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
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
  container: { flex: 1, backgroundColor: COLORS.background.primary },

  header: {
    paddingHorizontal: SIZES.padding,
    paddingTop: 10,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: { fontSize: 22, fontWeight: '900', color: COLORS.text.primary },
  subTitle: { marginTop: 4, fontSize: 12.5, fontWeight: '700', color: COLORS.text.secondary },

  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background.secondary,
    borderWidth: 1,
    borderColor: (COLORS as any).borderSoft ?? COLORS.border,
  },

  tabsWrap: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.padding,
    gap: 8,
    marginBottom: 10,
  },
  tabPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: COLORS.background.secondary,
    borderWidth: 1,
    borderColor: (COLORS as any).borderSoft ?? COLORS.border,
    alignItems: 'center',
  },
  tabPillActive: {
    backgroundColor: COLORS.text.primary,
    borderColor: COLORS.text.primary,
  },
  tabText: { fontSize: 12.5, fontWeight: '900', color: COLORS.text.secondary },
  tabTextActive: { color: '#fff' },

  // states (guest/empty/error)
  stateWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingBottom: 30,
  },
  stateIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: (COLORS as any).primarySoft ?? COLORS.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: (COLORS as any).borderSoft ?? COLORS.border,
    marginBottom: 12,
  },
  stateTitle: { fontSize: 16.5, fontWeight: '900', color: COLORS.text.primary, marginTop: 4 },
  stateText: {
    marginTop: 8,
    fontSize: 13,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 14,
  },

  primaryBtn: {
    marginTop: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryBtnText: { color: '#fff', fontWeight: '900', fontSize: 13.5 },

  centerBox: { padding: 22, alignItems: 'center', gap: 10 },
  centerText: { color: COLORS.text.secondary, textAlign: 'center' },

  listWrap: { paddingHorizontal: SIZES.padding, paddingTop: 4 },

  bookingCard: {
    backgroundColor: COLORS.background.primary,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: (COLORS as any).borderSoft ?? COLORS.border,
    padding: 14,
    marginBottom: 14,

    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },

  cardTopRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  providerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: COLORS.background.secondary,
    borderWidth: 1,
    borderColor: (COLORS as any).borderSoft ?? COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },

  bookingTitle: { fontSize: 15, fontWeight: '900', color: COLORS.text.primary },
  providerName: { marginTop: 4, fontSize: 12.5, fontWeight: '700', color: COLORS.text.secondary },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
  },
  statusText: { fontSize: 12, fontWeight: '900' },

  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: COLORS.background.secondary,
    borderWidth: 1,
    borderColor: (COLORS as any).borderSoft ?? COLORS.border,
  },
  chipText: { fontSize: 12.5, fontWeight: '800', color: COLORS.text.secondary },

  chipStrong: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: (COLORS as any).primarySoft ?? COLORS.background.secondary,
    borderWidth: 1,
    borderColor: (COLORS as any).borderSoft ?? COLORS.border,
  },
  chipStrongText: { fontSize: 12.5, fontWeight: '900', color: COLORS.primary },

  cardBottomRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: (COLORS as any).borderSoft ?? COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookingNumber: { fontSize: 12.5, color: COLORS.text.light, fontWeight: '800' },

  viewDetailsRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewDetails: { fontSize: 12.5, color: COLORS.primary, fontWeight: '900' },
});
