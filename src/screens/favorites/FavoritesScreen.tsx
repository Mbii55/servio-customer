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

import { COLORS, SIZES } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { getMyFavorites, removeFavorite, removeProviderFavorite, FavoriteType } from '../../services/favorites';
import { FavoriteCard, FavoriteServiceItem } from '../../components/favorites/FavoriteCard';

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
      return <FavoriteCard item={item} onPress={() => onPressItem(item)} onRemove={() => onRemove(item)} />;
    }

    // Render provider card
    const businessName = item.provider_business_name || `${item.provider_first_name_direct} ${item.provider_last_name_direct}`;
    const avatarUri = item.provider_business_logo || item.provider_profile_image_direct;

    return (
      <TouchableOpacity
        style={styles.providerCard}
        onPress={() => onPressItem(item)}
        activeOpacity={0.7}
      >
        <View style={styles.providerContent}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.providerAvatar} />
          ) : (
            <View style={styles.providerAvatarPlaceholder}>
              <Text style={styles.avatarText}>{businessName.charAt(0).toUpperCase()}</Text>
            </View>
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
                  <Ionicons name="location-outline" size={14} color={COLORS.text.secondary} />
                  <Text style={styles.metaText}>{item.provider_country}</Text>
                </View>
              )}
              <View style={styles.metaItem}>
                <Ionicons name="briefcase-outline" size={14} color={COLORS.text.secondary} />
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
          >
            <Ionicons name="heart" size={20} color={COLORS.danger} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Saved</Text>
          <Text style={styles.subTitle}>
            {items.length ? `${items.length} saved items` : 'Your saved items will appear here'}
          </Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'service' && styles.filterTabActive]}
          onPress={() => setFilter('service')}
        >
          <Text style={[styles.filterText, filter === 'service' && styles.filterTextActive]}>
            Services
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'provider' && styles.filterTabActive]}
          onPress={() => setFilter('provider')}
        >
          <Text style={[styles.filterText, filter === 'provider' && styles.filterTextActive]}>
            Shops
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {!items.length ? (
        <View style={styles.emptyWrap}>
          <View style={styles.emptyIcon}>
            <Ionicons name="heart-outline" size={28} color={COLORS.primary} />
          </View>
          <Text style={styles.emptyTitle}>No favorites yet</Text>
          <Text style={styles.emptySub}>
            {filter === 'all' && 'Tap the heart on any service or shop to save it here.'}
            {filter === 'service' && 'Tap the heart on any service to save it here.'}
            {filter === 'provider' && 'Tap the heart on any shop to save it here.'}
          </Text>

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate('Search')}
            activeOpacity={0.9}
          >
            <Text style={styles.primaryBtnText}>Explore services</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.listContent}
          data={items}
          keyExtractor={(item) => item.favorite_id}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background.primary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    paddingHorizontal: SIZES.padding,
    paddingTop: 8,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: { fontSize: 22, fontWeight: '900', color: COLORS.text.primary },
  subTitle: { marginTop: 4, fontSize: 12.5, fontWeight: '700', color: COLORS.text.secondary },
  
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.padding,
    marginBottom: 12,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.background.secondary,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },
  filterTextActive: {
    color: '#fff',
  },

  listContent: { paddingHorizontal: SIZES.padding, paddingTop: 6, paddingBottom: 16 },

  // Provider card styles
  providerCard: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: SIZES.radius,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  providerContent: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
  },
  providerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  providerAvatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
  },
  providerInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  providerName: {
    fontSize: SIZES.body,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  providerDescription: {
    fontSize: SIZES.small,
    color: COLORS.text.secondary,
    lineHeight: 18,
    marginBottom: 6,
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
    fontSize: SIZES.small,
    color: COLORS.text.secondary,
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: COLORS.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  emptyTitle: { marginTop: 6, fontSize: 16.5, fontWeight: '900', color: COLORS.text.primary },
  emptySub: {
    marginTop: 6,
    fontSize: 13,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 14,
  },
  primaryBtn: {
    marginTop: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryBtnText: { color: '#fff', fontWeight: '900', fontSize: 13.5 },
});