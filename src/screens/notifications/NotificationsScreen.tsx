// src/screens/notifications/NotificationsScreen.tsx
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
  SafeAreaView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
    if (!items.length || unreadCount === 0) return;

    Alert.alert(
      'Mark All as Read',
      `Mark ${unreadCount} notification${unreadCount > 1 ? 's' : ''} as read?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Read',
          onPress: async () => {
            // optimistic
            setItems((prev) => prev.map((x) => ({ ...x, is_read: true })));
            try {
              await markAllNotificationsRead();
            } catch (e: any) {
              Alert.alert('Error', e?.response?.data?.message || e?.message || 'Failed to mark all as read');
              // optional revert: reload
              load();
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconContainer}>
            <Ionicons name="notifications" size={24} color={COLORS.primary} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Notifications</Text>
            {unreadCount > 0 && (
              <Text style={styles.headerSubtitle}>{unreadCount} unread</Text>
            )}
          </View>
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity 
            onPress={onMarkAllRead} 
            activeOpacity={0.7}
            style={styles.markAllButton}
          >
            <Ionicons name="checkmark-done" size={18} color={COLORS.primary} />
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyState}>
          <LinearGradient
            colors={['#EFF6FF', '#DBEAFE']}
            style={styles.emptyIconContainer}
          >
            <Ionicons name="notifications-outline" size={48} color={COLORS.primary} />
          </LinearGradient>
          <Text style={styles.emptyTitle}>No notifications yet</Text>
          <Text style={styles.emptySubtitle}>
            You'll see updates about your bookings and services here
          </Text>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.listContent}
          data={items}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.notificationCard}
              onPress={() => onPressItem(item)}
              activeOpacity={0.7}
            >
              {!item.is_read && <View style={styles.unreadIndicator} />}
              
              <View style={styles.notificationContent}>
                <View style={styles.notificationHeader}>
                  <View style={[
                    styles.notificationIcon,
                    !item.is_read && styles.notificationIconUnread
                  ]}>
                    <Ionicons 
                      name={!item.is_read ? "notifications" : "notifications-outline"} 
                      size={20} 
                      color={!item.is_read ? COLORS.primary : COLORS.text.secondary} 
                    />
                  </View>
                  
                  <View style={{ flex: 1 }}>
                    <Text style={[
                      styles.notificationTitle,
                      !item.is_read && styles.notificationTitleUnread
                    ]} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.notificationTime}>
                      {timeAgo(item.created_at)}
                    </Text>
                  </View>

                  {!item.is_read && (
                    <View style={styles.unreadDot} />
                  )}
                </View>

                <Text style={styles.notificationMessage} numberOfLines={2}>
                  {item.message}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },

  // Loading
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

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.primary,
    marginTop: 2,
    fontWeight: '600',
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  markAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },

  // List
  listContent: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 24 : 24,
  },

  // Notification Card
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  unreadIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: COLORS.primary,
  },
  notificationContent: {
    padding: 16,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationIconUnread: {
    backgroundColor: '#EFF6FF',
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  notificationTitleUnread: {
    fontWeight: '700',
  },
  notificationTime: {
    fontSize: 12,
    color: COLORS.text.light,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  notificationMessage: {
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 20,
    paddingLeft: 52, // Align with title (icon width + gap)
  },
  separator: {
    height: 12,
  },

  // Empty State
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});