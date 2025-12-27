// src/screens/search/ExploreScreen.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  SafeAreaView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';

import api from '../../services/api';
import { COLORS, SIZES } from '../../constants/colors';
import { ServiceCard } from '../../components/services/ServiceCard';

type Category = {
  id: string;
  name: string;
  slug?: string;
  icon?: string | null;
};

type Service = any;
type Provider = any;
type SearchMode = 'services' | 'shops';

type ExploreScreenParams = {
  initialCategory?: string;
  categoryName?: string;
  searchMode?: 'services' | 'shops';
};

type ExploreScreenRouteProp = RouteProp<{ Search: ExploreScreenParams }, 'Search'>;
const looksLikeUrl = (x?: string | null) => !!x && /^https?:\/\//i.test(x.trim());

export const ExploreScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<ExploreScreenRouteProp>();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searching, setSearching] = useState(false);

  // Get initial params from navigation
  const initialCategory = route.params?.initialCategory;
  const initialMode = route.params?.searchMode || 'services';

  const [searchMode, setSearchMode] = useState<SearchMode>(initialMode);
  const [query, setQuery] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory || null);


  // Pagination state
  const [hasMoreServices, setHasMoreServices] = useState(false);
  const [hasMoreProviders, setHasMoreProviders] = useState(false);
  const [totalServices, setTotalServices] = useState(0);
  const [totalProviders, setTotalProviders] = useState(0);
  const [offset, setOffset] = useState(0);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const catRes = await api.get('/categories');
      const cats = (catRes.data?.data ?? catRes.data ?? []) as Category[];
      setCategories(Array.isArray(cats) ? cats.filter((c) => c?.id && c?.name) : []);

      await loadResults(true);
    } catch (error) {
      console.error('Load error:', error);
      setCategories([]);
      setServices([]);
      setProviders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadResults = useCallback(async (reset = false) => {
    try {
      setSearching(true);
      const currentOffset = reset ? 0 : offset;

      const params = new URLSearchParams();
      if (query.trim()) params.append('query', query.trim());
      if (selectedCategory && searchMode === 'services') {
        params.append('categoryId', selectedCategory);
      }
      params.append('limit', '20');
      params.append('offset', currentOffset.toString());

      const res = await api.get(`/search?${params.toString()}`);
      const data = res.data;

      const newServices = data.services?.items || [];
      const newProviders = data.providers?.items || [];

      if (reset) {
        setServices(newServices);
        setProviders(newProviders);
        setOffset(20);
      } else {
        if (searchMode === 'services') {
          setServices(prev => [...prev, ...newServices]);
        } else {
          setProviders(prev => [...prev, ...newProviders]);
        }
        setOffset(currentOffset + 20);
      }

      setTotalServices(data.services?.total || 0);
      setTotalProviders(data.providers?.total || 0);
      setHasMoreServices(currentOffset + newServices.length < (data.services?.total || 0));
      setHasMoreProviders(currentOffset + newProviders.length < (data.providers?.total || 0));
    } catch (error) {
      console.error('Load results error:', error);
      if (reset) {
        setServices([]);
        setProviders([]);
        setTotalServices(0);
        setTotalProviders(0);
        setHasMoreServices(false);
        setHasMoreProviders(false);
      }
    } finally {
      setSearching(false);
    }
  }, [query, selectedCategory, offset, searchMode]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadResults(true);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, selectedCategory, searchMode]);

  useEffect(() => {
    if (route.params?.initialCategory) {
      setSelectedCategory(route.params.initialCategory);
      setSearchMode('services'); // Always switch to services when filtering by category
    }
    if (route.params?.searchMode) {
      setSearchMode(route.params.searchMode);
    }
  }, [route.params]);

  useEffect(() => {
    load();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setQuery('');
    setSelectedCategory(null);
    await load();
    setRefreshing(false);
  }, [load]);

  const popularServices = useMemo(() => services.slice(0, 10), [services]);
  const featuredProviders = useMemo(() => providers.slice(0, 10), [providers]);

  const openService = (serviceId: string) => {
    navigation.navigate('ServiceDetails', { serviceId });
  };

  const openProvider = (providerId: string) => {
    navigation.navigate('ProviderDetails', { providerId });
  };

  const openCategory = (categoryId: string) => {
    setSelectedCategory(categoryId === selectedCategory ? null : categoryId);
    setQuery('');
  };

  const clearSearch = () => {
    setQuery('');
    setSelectedCategory(null);
  };

  const loadMore = () => {
    const hasMore = searchMode === 'services' ? hasMoreServices : hasMoreProviders;
    if (!searching && hasMore) {
      loadResults(false);
    }
  };

  const viewAllProviders = () => {
    // TODO: Navigate to all providers screen
    console.log('Navigate to all providers');
  };

  const switchMode = (mode: SearchMode) => {
    setSearchMode(mode);
    setQuery('');
    setSelectedCategory(null);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.muted}>Loading explore…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isSearching = !!(query || selectedCategory);
  const currentData = searchMode === 'services' ? services : providers;
  const currentTotal = searchMode === 'services' ? totalServices : totalProviders;
  const hasMore = searchMode === 'services' ? hasMoreServices : hasMoreProviders;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.headerWrap}>
          <View style={styles.topRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.h1}>Explore</Text>
              <Text style={styles.subH1}>Search services and discover what's near you.</Text>
            </View>

            <TouchableOpacity
              onPress={() => navigation.navigate('Notifications')}
              style={styles.iconBtn}
              activeOpacity={0.9}
            >
              <Ionicons name="notifications-outline" size={20} color={COLORS.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Search Mode Toggle */}
          <View style={styles.modeToggle}>
            <TouchableOpacity
              style={[styles.modeButton, searchMode === 'services' && styles.modeButtonActive]}
              onPress={() => switchMode('services')}
              activeOpacity={0.7}
            >
              <Ionicons
                name="briefcase-outline"
                size={18}
                color={searchMode === 'services' ? '#fff' : COLORS.text.secondary}
              />
              <Text style={[styles.modeText, searchMode === 'services' && styles.modeTextActive]}>
                Services
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeButton, searchMode === 'shops' && styles.modeButtonActive]}
              onPress={() => switchMode('shops')}
              activeOpacity={0.7}
            >
              <Ionicons
                name="storefront-outline"
                size={18}
                color={searchMode === 'shops' ? '#fff' : COLORS.text.secondary}
              />
              <Text style={[styles.modeText, searchMode === 'shops' && styles.modeTextActive]}>
                Shops
              </Text>
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchCard}>
            <View style={styles.searchIcon}>
              <Ionicons name="search-outline" size={18} color={COLORS.text.secondary} />
            </View>

            <TextInput
              placeholder={searchMode === 'services' ? 'Search services…' : 'Search shops…'}
              placeholderTextColor={COLORS.text.secondary}
              value={query}
              onChangeText={setQuery}
              style={styles.searchInput}
              returnKeyType="search"
            />

            {isSearching && (
              <TouchableOpacity onPress={clearSearch} style={styles.clearBtn} activeOpacity={0.9}>
                <Ionicons name="close" size={18} color={COLORS.text.secondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Active filters indicator */}
          {isSearching && (
            <View style={styles.filterIndicator}>
              <Ionicons name="funnel-outline" size={14} color={COLORS.primary} />
              <Text style={styles.filterText}>
                {query && `"${query}"`}
                {query && selectedCategory && ' • '}
                {selectedCategory && categories.find(c => c.id === selectedCategory)?.name}
              </Text>
            </View>
          )}

          {/* Categories - Only show for services mode */}
          {searchMode === 'services' && (
            <View style={{ marginTop: 16 }}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Categories</Text>
                {selectedCategory && (
                  <TouchableOpacity onPress={() => setSelectedCategory(null)} activeOpacity={0.9}>
                    <Text style={styles.link}>Clear filter</Text>
                  </TouchableOpacity>
                )}
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.chipsRow}>
                  {categories.map((c) => (
                    <CategoryChip
                      key={c.id}
                      c={c}
                      onPress={() => openCategory(c.id)}
                      isSelected={c.id === selectedCategory}
                    />
                  ))}
                </View>
              </ScrollView>
            </View>
          )}
        </View>

        {/* Content based on search mode and search state */}
        {!isSearching && searchMode === 'shops' && featuredProviders.length > 0 && (
          <View style={styles.section}>
            <View style={[styles.sectionHeader, styles.sectionHeaderPadded]}>
              <Text style={styles.sectionTitle}>Featured Shops</Text>
              {/* <TouchableOpacity onPress={viewAllProviders} activeOpacity={0.9}>
                <View style={styles.viewAllBtn}>
                  <Text style={styles.link}>View all</Text>
                  <Ionicons name="arrow-forward" size={14} color={COLORS.primary} />
                </View>
              </TouchableOpacity> */}
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.shopsRow}>
                {featuredProviders.map((provider) => (
                  <ShopCard
                    key={provider.id}
                    provider={provider}
                    onPress={() => openProvider(provider.id)}
                  />
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {!isSearching && searchMode === 'services' && popularServices.length > 0 && (
          <View style={styles.section}>
            <View style={[styles.sectionHeader, styles.sectionHeaderPadded]}>
              <Text style={styles.sectionTitle}>Popular Services</Text>
              <Text style={styles.hint}>{popularServices.length} picks</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.popularRow}>
                {popularServices.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    onPress={() => openService(service.id)}
                    style={styles.popularCard}
                  />
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Search Results or All Items */}
        <View style={styles.section}>
          <View style={[styles.sectionHeader, styles.sectionHeaderPadded]}>
            <Text style={styles.sectionTitle}>
              {isSearching ? 'Search Results' : searchMode === 'services' ? 'All Services' : 'All Shops'}
            </Text>
            <Text style={styles.hint}>{currentTotal} results</Text>
          </View>

          {searchMode === 'services' ? (
            <View style={styles.servicesGrid}>
              {currentData.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onPress={() => openService(service.id)}
                  style={styles.gridCard}
                />
              ))}
            </View>
          ) : (
            <View>
              {currentData.map((provider) => (
                <ProviderCard
                  key={provider.id}
                  provider={provider}
                  onPress={() => openProvider(provider.id)}
                />
              ))}
            </View>
          )}

          {currentData.length === 0 && !searching && (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name={searchMode === 'services' ? 'briefcase-outline' : 'storefront-outline'}
                  size={22}
                  color={COLORS.primary}
                />
              </View>
              <Text style={styles.emptyTitle}>
                No {searchMode === 'services' ? 'services' : 'shops'} found
              </Text>
              <Text style={styles.muted}>
                {isSearching
                  ? 'Try another keyword or filter.'
                  : `No ${searchMode} available at the moment.`}
              </Text>

              {isSearching && (
                <TouchableOpacity style={styles.secondaryBtn} onPress={clearSearch} activeOpacity={0.9}>
                  <Text style={styles.secondaryBtnText}>Clear filters</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {hasMore && !searching && currentData.length > 0 && (
            <TouchableOpacity style={styles.loadMoreBtn} onPress={loadMore}>
              <Text style={styles.loadMoreText}>
                Load more {searchMode === 'services' ? 'services' : 'shops'}
              </Text>
              <Ionicons name="chevron-down" size={16} color={COLORS.primary} />
            </TouchableOpacity>
          )}
        </View>

        {searching && (
          <View style={styles.loadingMore}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.muted}>Loading...</Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// Shop Card Component (Horizontal)
const ShopCard: React.FC<{ provider: any; onPress: () => void }> = ({ provider, onPress }) => {
  const businessName = provider.business_name || `${provider.first_name} ${provider.last_name}`;
  const avatarUri = provider.business_logo || provider.profile_image;

  return (
    <TouchableOpacity style={styles.shopCard} onPress={onPress} activeOpacity={0.7}>
      {avatarUri ? (
        <Image source={{ uri: avatarUri }} style={styles.shopAvatar} />
      ) : (
        <View style={styles.shopAvatarPlaceholder}>
          <Text style={styles.shopAvatarText}>{businessName.charAt(0).toUpperCase()}</Text>
        </View>
      )}

      <View style={styles.shopInfo}>
        <Text style={styles.shopName} numberOfLines={1}>
          {businessName}
        </Text>
        {provider.country && (
          <View style={styles.shopLocation}>
            <Ionicons name="location-outline" size={12} color={COLORS.text.secondary} />
            <Text style={styles.shopLocationText} numberOfLines={1}>
              {provider.country}
            </Text>
          </View>
        )}
        <View style={styles.shopServices}>
          <Ionicons name="briefcase-outline" size={12} color={COLORS.primary} />
          <Text style={styles.shopServicesText}>{provider.service_count} services</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Provider Card Component (Full Width)
const ProviderCard: React.FC<{ provider: any; onPress: () => void }> = ({ provider, onPress }) => {
  const businessName = provider.business_name || `${provider.first_name} ${provider.last_name}`;
  const avatarUri = provider.business_logo || provider.profile_image;

  return (
    <TouchableOpacity style={styles.providerCard} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.providerContent}>
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={styles.providerAvatar} />
        ) : (
          <View style={styles.providerAvatarPlaceholder}>
            <Text style={styles.avatarText}>{businessName.charAt(0).toUpperCase()}</Text>
          </View>
        )}

        <View style={styles.providerInfo}>
          <View style={styles.providerBadge}>
            <Ionicons name="storefront" size={12} color={COLORS.primary} />
            <Text style={styles.providerBadgeText}>Shop</Text>
          </View>
          <Text style={styles.providerName} numberOfLines={1}>
            {businessName}
          </Text>
          {provider.business_description && (
            <Text style={styles.providerDescription} numberOfLines={2}>
              {provider.business_description}
            </Text>
          )}
          <View style={styles.providerMeta}>
            {provider.country && (
              <View style={styles.metaItem}>
                <Ionicons name="location-outline" size={12} color={COLORS.text.secondary} />
                <Text style={styles.metaText}>{provider.country}</Text>
              </View>
            )}
            <View style={styles.metaItem}>
              <Ionicons name="briefcase-outline" size={12} color={COLORS.text.secondary} />
              <Text style={styles.metaText}>{provider.service_count} services</Text>
            </View>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={20} color={COLORS.text.light} />
      </View>
    </TouchableOpacity>
  );
};

const CategoryChip: React.FC<{
  c: Category;
  onPress: () => void;
  isSelected?: boolean;
}> = ({ c, onPress, isSelected = false }) => {
  const icon = (c.icon ?? '').trim();

  const leftNode = looksLikeUrl(icon) ? (
    <Image source={{ uri: icon }} style={styles.chipIconImg} />
  ) : icon.length > 0 ? (
    <Text style={styles.chipEmoji}>{icon}</Text>
  ) : (
    <Ionicons
      name="grid-outline"
      size={16}
      color={isSelected ? '#fff' : COLORS.primary}
    />
  );

  return (
    <TouchableOpacity
      style={[styles.chip, isSelected && styles.chipActive]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={[styles.chipIcon, isSelected && styles.chipIconActive]}>
        {leftNode}
      </View>
      <Text style={[styles.chipText, isSelected && styles.chipTextActive]} numberOfLines={1}>
        {c.name}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background.primary },
  scrollView: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  muted: { marginTop: 10, fontSize: 13, color: COLORS.text.secondary, textAlign: 'center' },

  headerWrap: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 8 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  h1: { fontSize: 28, fontWeight: '900', color: COLORS.text.primary },
  subH1: { marginTop: 6, fontSize: 13, color: COLORS.text.secondary, lineHeight: 18 },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: COLORS.background.secondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Mode Toggle
  modeToggle: {
    flexDirection: 'row',
    marginTop: 14,
    backgroundColor: COLORS.background.secondary,
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 6,
  },
  modeButtonActive: {
    backgroundColor: COLORS.primary,
  },
  modeText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text.secondary,
  },
  modeTextActive: {
    color: '#fff',
  },

  searchCard: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.secondary,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  searchIcon: {
    width: 34,
    height: 34,
    borderRadius: 14,
    backgroundColor: COLORS.background.primary,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInput: { flex: 1, fontSize: 14.5, color: COLORS.text.primary },
  clearBtn: {
    width: 34,
    height: 34,
    borderRadius: 14,
    backgroundColor: COLORS.background.primary,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  filterIndicator: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.background.secondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignSelf: 'flex-start',
  },
  filterText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },

  section: { marginTop: 18 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionHeaderPadded: { paddingHorizontal: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '900', color: COLORS.text.primary },
  hint: { fontSize: 12, fontWeight: '700', color: COLORS.text.secondary },
  link: { fontSize: 12.5, fontWeight: '800', color: COLORS.primary },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  chipsRow: { flexDirection: 'row', gap: 10, paddingVertical: 2 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: COLORS.background.secondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxWidth: 190,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.background.primary,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  chipIconActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  chipIconImg: { width: '100%', height: '100%' },
  chipEmoji: { fontSize: 14 },
  chipText: { fontSize: 13, fontWeight: '900', color: COLORS.text.primary },
  chipTextActive: { color: '#fff' },

  // Shops horizontal row
  shopsRow: { flexDirection: 'row', paddingLeft: 16, paddingBottom: 4 },
  shopCard: {
    width: 140,
    marginRight: 12,
    backgroundColor: COLORS.background.secondary,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  shopAvatar: {
    width: '100%',
    height: 120,
  },
  shopAvatarPlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shopAvatarText: {
    fontSize: 40,
    fontWeight: '600',
    color: '#fff',
  },
  shopInfo: {
    padding: 12,
  },
  shopName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 6,
  },
  shopLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  shopLocationText: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  shopServices: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  shopServicesText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // Popular services
  popularRow: { flexDirection: 'row', paddingLeft: 16, paddingBottom: 4 },
  popularCard: { width: 230, marginRight: 12 },

  // Provider Card (full width for search results)
  providerCard: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: SIZES.radius,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  providerContent: {
    flexDirection: 'row',
    padding: 14,
    alignItems: 'center',
  },
  providerAvatar: { width: 56, height: 56, borderRadius: 28 },
  providerAvatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 22, fontWeight: '600', color: '#fff' },
  providerInfo: { flex: 1, marginLeft: 12, marginRight: 8 },
  providerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: COLORS.background.primary,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  providerBadgeText: { fontSize: 11, fontWeight: '700', color: COLORS.primary },
  providerName: { fontSize: SIZES.body, fontWeight: '700', color: COLORS.text.primary, marginBottom: 4 },
  providerDescription: {
    fontSize: SIZES.small,
    color: COLORS.text.secondary,
    lineHeight: 18,
    marginBottom: 6,
  },
  providerMeta: { flexDirection: 'row', gap: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: SIZES.small, color: COLORS.text.secondary },

  // Services grid
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  gridCard: { width: '48%', marginHorizontal: 0, marginBottom: 12 },

  loadingMore: { paddingVertical: 20, alignItems: 'center' },
  loadMoreBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: COLORS.background.secondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignSelf: 'center',
    marginVertical: 20,
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadMoreText: { fontSize: 14, fontWeight: '700', color: COLORS.primary },

  empty: { alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: COLORS.background.secondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { marginTop: 10, fontSize: 16, fontWeight: '900', color: COLORS.text.primary },
  secondaryBtn: {
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: COLORS.background.secondary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryBtnText: { fontSize: 13, fontWeight: '900', color: COLORS.text.primary },
});