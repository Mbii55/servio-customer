import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { COLORS, SIZES } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import {
  listMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  NotificationItem,
} from '../../services/notifications';

function timeAgo(iso: string) {
  const d = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - d);

  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export const NotificationsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);

  const unreadCount = useMemo(
    () => items.filter((n) => !n.is_read).length,
    [items]
  );

  const normalize = (data: any): NotificationItem[] => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.items)) return data.items;
    return [];
  };

  const load = useCallback(async () => {
    if (!isAuthenticated) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      const data = await listMyNotifications({ limit: 50, offset: 0 });
      setItems(normalize(data));
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || e?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const onPressItem = async (item: NotificationItem) => {
    // Mark read (optimistic)
    if (!item.is_read) {
      setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, is_read: true } : x)));
      try {
        await markNotificationRead(item.id);
      } catch {
        // revert if needed (optional)
      }
    }

    // Optional: if you stored booking_id/service_id in item.data, navigate based on it
    // Example:
    // if (item.data?.booking_id) navigation.navigate('Bookings', { screen: 'BookingDetails', params: { bookingId: item.data.booking_id } });
  };

  const onMarkAllRead = async () => {
    if (!items.length) return;

    // optimistic
    setItems((prev) => prev.map((x) => ({ ...x, is_read: true })));
    try {
      await markAllNotificationsRead();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || e?.message || 'Failed to mark all as read');
      // optional revert: reload
      load();
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top actions */}
      <View style={styles.topRow}>
        <Text style={styles.title}>Notifications</Text>

        <TouchableOpacity onPress={onMarkAllRead} activeOpacity={0.8} style={styles.markAllBtn}>
          <Ionicons name="checkmark-done-outline" size={18} color={COLORS.primary} />
          <Text style={styles.markAllText}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      {items.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="notifications-outline" size={42} color={COLORS.text.secondary} />
          <Text style={styles.emptyTitle}>No notifications</Text>
          <Text style={styles.emptySub}>You’ll see updates about your bookings here.</Text>
        </View>
      ) : (
        <>
          <Text style={styles.unreadText}>
            Unread: <Text style={{ fontWeight: '800' }}>{unreadCount}</Text>
          </Text>

          <FlatList
            contentContainerStyle={{ padding: 16, paddingBottom: 30 }}
            data={items}
            keyExtractor={(item) => item.id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.card, !item.is_read && styles.cardUnread]}
                onPress={() => onPressItem(item)}
                activeOpacity={0.85}
              >
                <View style={styles.cardRow}>
                  <View style={[styles.dot, !item.is_read ? styles.dotOn : styles.dotOff]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.cardMsg} numberOfLines={2}>
                      {item.message}
                    </Text>
                    <Text style={styles.cardTime}>{timeAgo(item.created_at)}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={COLORS.text.light} />
                </View>
              </TouchableOpacity>
            )}
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background.secondary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },

  topRow: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 20, fontWeight: '900', color: COLORS.text.primary },
  markAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8 },
  markAllText: { color: COLORS.primary, fontWeight: '800', fontSize: 13 },

  unreadText: { paddingHorizontal: 16, paddingBottom: 6, color: COLORS.text.secondary },

  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardUnread: {
    borderColor: COLORS.primary,
    backgroundColor: '#FFFFFF',
  },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 5 },
  dotOn: { backgroundColor: COLORS.primary },
  dotOff: { backgroundColor: '#d1d5db' },

  cardTitle: { fontWeight: '900', color: COLORS.text.primary, fontSize: 14 },
  cardMsg: { marginTop: 4, color: COLORS.text.secondary, fontSize: 13, lineHeight: 18 },
  cardTime: { marginTop: 8, color: COLORS.text.light, fontSize: 12 },

  emptyTitle: { marginTop: 10, fontSize: 16, fontWeight: '800', color: COLORS.text.primary },
  emptySub: { marginTop: 6, fontSize: 13, color: COLORS.text.secondary, textAlign: 'center' },
});
