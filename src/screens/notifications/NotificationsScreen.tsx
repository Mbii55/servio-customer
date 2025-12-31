// src/screens/notifications/NotificationsScreen.tsx
import React, { useMemo, useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';

import { COLORS, SIZES } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { NotificationItem } from '../../services/notifications';

// ✅ NEW: Import React Query hooks
import { 
  useNotifications, 
  useMarkNotificationRead, 
  useMarkAllNotificationsRead 
} from '../../hooks/useNotifications';

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

  // ✅ NEW: React Query hooks - replaces all manual state management!
  const { 
    data: items = [], 
    isLoading: loading,
    refetch 
  } = useNotifications({ limit: 50, offset: 0 }, isAuthenticated);

  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();

  // ✅ SIMPLIFIED: Calculate unread count from cached data
  const unreadCount = useMemo(
    () => items.filter((n: NotificationItem) => !n.is_read).length,
    [items]
  );

  // ✅ SIMPLIFIED: Pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // ✅ IMPROVED: Optimistic mark as read and navigate to booking
  const onPressItem = async (item: NotificationItem) => {
    // Mark read with optimistic update
    if (!item.is_read) {
      try {
        await markReadMutation.mutateAsync(item.id);
        // React Query automatically updates the UI!
      } catch (error) {
        // Error handling is automatic (rollback on failure)
      }
    }

    // Navigate to booking details if notification has booking data
    if (item.data?.booking_id) {
      navigation.navigate('BookingDetails', { 
        bookingId: item.data.booking_id 
      });
    }
  };

  // ✅ IMPROVED: Optimistic mark all as read
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
            try {
              await markAllReadMutation.mutateAsync();
              // React Query automatically updates the UI!
            } catch (e: any) {
              Alert.alert(
                'Error', 
                e?.response?.data?.message || e?.message || 'Failed to mark all as read'
              );
            }
          },
        },
      ]
    );
  };

  if (loading && items.length === 0) {
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

// ✅ Keep all your existing styles - no changes needed!
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
  },
  markAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  emptyState: {
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
  },
  listContent: {
    padding: 16,
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  unreadIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: COLORS.primary,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  notificationContent: {
    gap: 8,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationIconUnread: {
    backgroundColor: '#EFF6FF',
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
  },
  notificationTitleUnread: {
    fontWeight: '600',
    color: '#111827',
  },
  notificationTime: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginLeft: 48,
  },
  separator: {
    height: 12,
  },
});