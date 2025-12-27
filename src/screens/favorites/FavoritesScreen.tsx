// src/screens/favorites/FavoritesScreen.tsx
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TouchableOpacity,
  SafeAreaView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

import { COLORS, SIZES } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { getMyFavorites, removeFavorite, removeProviderFavorite, FavoriteType } from '../../services/favorites';
import { FavoriteCard } from '../../components/favorites/FavoriteCard';

type FilterOption = 'all' | 'service' | 'provider';

export const FavoritesScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [filter, setFilter] = useState<FilterOption>('all');

  const load = useCallback(async () => {
    if (!isAuthenticated) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      const typeFilter = filter === 'all' ? undefined : filter as FavoriteType;
      const data = await getMyFavorites(typeFilter);
      setItems(data);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to load favorites');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, filter]);

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

  const onRemove = async (item: any) => {
    try {
      if (item.favorite_type === 'service') {
        await removeFavorite(item.id);
      } else {
        await removeProviderFavorite(item.provider_favorite_id);
      }
      setItems((prev) => prev.filter((x) => x.favorite_id !== item.favorite_id));
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to remove favorite');
    }
  };

  const onPressItem = (item: any) => {
    if (item.favorite_type === 'service') {
      navigation.navigate('ServiceDetails', { serviceId: item.id });
    } else {
      navigation.navigate('ProviderDetails', { providerId: item.provider_favorite_id });
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    if (item.favorite_type === 'service') {
      return (
        <FavoriteCard 
          item={item} 
          onPress={() => onPressItem(item)} 
          onRemove={() => onRemove(item)} 
        />
      );
    }

    // Provider card
    const businessName = item.provider_business_name || `${item.provider_first_name_direct} ${item.provider_last_name_direct}`;
    const avatarUri = item.provider_business_logo || item.provider_profile_image_direct;

    return (
      <TouchableOpacity
        style={styles.providerCard}
        onPress={() => onPressItem(item)}
        activeOpacity={0.8}
      >
        <View style={styles.providerContent}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.providerAvatar} />
          ) : (
            <LinearGradient
              colors={[COLORS.primary, COLORS.secondary]}
              style={styles.providerAvatarPlaceholder}
            >
              <Text style={styles.avatarText}>{businessName.charAt(0).toUpperCase()}</Text>
            </LinearGradient>
          )}

          <View style={styles.providerInfo}>
            <Text style={styles.providerName} numberOfLines={1}>
              {businessName}
            </Text>
            {item.provider_business_description && (
              <Text style={styles.providerDescription} numberOfLines={2}>
                {item.provider_business_description}
              </Text>
            )}
            <View style={styles.providerMeta}>
              {item.provider_country && (
                <View style={styles.metaItem}>
                  <Ionicons name="location" size={12} color={COLORS.text.secondary} />
                  <Text style={styles.metaText}>{item.provider_country}</Text>
                </View>
              )}
              <View style={styles.metaItem}>
                <Ionicons name="briefcase" size={12} color={COLORS.primary} />
                <Text style={styles.metaText}>{item.service_count} services</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.removeButton}
            onPress={(e) => {
              e.stopPropagation();
              onRemove(item);
            }}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <View style={styles.removeButtonInner}>
              <Ionicons name="heart" size={20} color="#EF4444" />
            </View>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading favorites...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Favorites</Text>
          <Text style={styles.headerSubtitle}>
            {items.length ? `${items.length} saved items` : 'Your saved items'}
          </Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsContainer}>
        {[
          { key: 'all', label: 'All', icon: 'apps' },
          { key: 'service', label: 'Services', icon: 'briefcase' },
          { key: 'provider', label: 'Shops', icon: 'storefront' },
        ].map((tab) => {
          const active = filter === tab.key;
          const count = items.filter(item => {
            if (tab.key === 'all') return true;
            return item.favorite_type === tab.key;
          }).length;

          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tab}
              onPress={() => setFilter(tab.key as FilterOption)}
              activeOpacity={0.7}
            >
              {active ? (
                <LinearGradient
                  colors={[COLORS.primary, COLORS.secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.tabActive}
                >
                  <Ionicons name={tab.icon as any} size={16} color="#FFF" />
                  <Text style={styles.tabTextActive}>{tab.label}</Text>
                  {count > 0 && (
                    <View style={styles.tabBadge}>
                      <Text style={styles.tabBadgeText}>{count}</Text>
                    </View>
                  )}
                </LinearGradient>
              ) : (
                <View style={styles.tabInactive}>
                  <Ionicons name={`${tab.icon}-outline` as any} size={16} color={COLORS.text.secondary} />
                  <Text style={styles.tabTextInactive}>{tab.label}</Text>
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

      {/* Content */}
      {!items.length ? (
        <View style={styles.emptyContainer}>
          <LinearGradient
            colors={['#FEF2F2', '#FEE2E2']}
            style={styles.emptyIconContainer}
          >
            <Ionicons name="heart-outline" size={48} color="#EF4444" />
          </LinearGradient>
          
          <Text style={styles.emptyTitle}>No favorites yet</Text>
          <Text style={styles.emptySubtitle}>
            {filter === 'all' && 'Tap the heart on any service or shop to save it here'}
            {filter === 'service' && 'Tap the heart on any service to save it here'}
            {filter === 'provider' && 'Tap the heart on any shop to save it here'}
          </Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Search')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>Explore Services</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.listContent}
          data={items}
          keyExtractor={(item) => item.favorite_id}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 6,
  },
  tabInactive: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    gap: 6,
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

  // List
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
  },

  // Provider Card
  providerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  providerContent: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  providerAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  providerAvatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  providerInfo: {
    flex: 1,
    marginLeft: 14,
    marginRight: 10,
  },
  providerName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  providerDescription: {
    fontSize: 13,
    color: COLORS.text.secondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  providerMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.text.secondary,
    fontWeight: '600',
  },
  removeButton: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  removeButtonInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Empty State
  emptyContainer: {
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
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },

  // Button
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
});