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
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

import api from '../../services/api';
import { COLORS, SIZES } from '../../constants/colors';
import { ServiceCard } from '../../components/services/ServiceCard';

const { width } = Dimensions.get('window');

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

  const initialCategory = route.params?.initialCategory;
  const initialMode = route.params?.searchMode || 'services';

  const [searchMode, setSearchMode] = useState<SearchMode>(initialMode);
  const [query, setQuery] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory || null);

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
      setSearchMode('services');
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

  const switchMode = (mode: SearchMode) => {
    setSearchMode(mode);
    setQuery('');
    setSelectedCategory(null);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Discovering services...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isSearching = !!(query || selectedCategory);
  const currentData = searchMode === 'services' ? services : providers;
  const currentTotal = searchMode === 'services' ? totalServices : totalProviders;
  const hasMore = searchMode === 'services' ? hasMoreServices : hasMoreProviders;

  return (
    <SafeAreaView style={styles.container}>
      {/* Fixed Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Explore</Text>
            <Text style={styles.headerSubtitle}>Discover services & providers</Text>
          </View>

          <TouchableOpacity
            style={styles.notificationBtn}
            onPress={() => navigation.navigate('Notifications')}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={24} color={COLORS.text.primary} />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={COLORS.text.secondary} />
            <TextInput
              placeholder={searchMode === 'services' ? 'Search services...' : 'Search shops...'}
              placeholderTextColor={COLORS.text.secondary}
              value={query}
              onChangeText={setQuery}
              style={styles.searchInput}
              returnKeyType="search"
            />
            {(query || selectedCategory) && (
              <TouchableOpacity onPress={clearSearch} activeOpacity={0.7}>
                <View style={styles.clearButton}>
                  <Ionicons name="close" size={18} color={COLORS.text.secondary} />
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Mode Toggle */}
        <View style={styles.modeContainer}>
          <TouchableOpacity
            style={[styles.modeButton, searchMode === 'services' && styles.modeButtonActive]}
            onPress={() => switchMode('services')}
            activeOpacity={0.7}
          >
            {searchMode === 'services' ? (
              <LinearGradient
                colors={[COLORS.primary, COLORS.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.modeGradient}
              >
                <Ionicons name="briefcase" size={18} color="#FFF" />
                <Text style={styles.modeTextActive}>Services</Text>
                {!isSearching && (
                  <View style={styles.modeBadge}>
                    <Text style={styles.modeBadgeText}>{totalServices}</Text>
                  </View>
                )}
              </LinearGradient>
            ) : (
              <View style={styles.modeInactive}>
                <Ionicons name="briefcase-outline" size={18} color={COLORS.text.secondary} />
                <Text style={styles.modeText}>Services</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeButton, searchMode === 'shops' && styles.modeButtonActive]}
            onPress={() => switchMode('shops')}
            activeOpacity={0.7}
          >
            {searchMode === 'shops' ? (
              <LinearGradient
                colors={[COLORS.primary, COLORS.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.modeGradient}
              >
                <Ionicons name="storefront" size={18} color="#FFF" />
                <Text style={styles.modeTextActive}>Shops</Text>
                {!isSearching && (
                  <View style={styles.modeBadge}>
                    <Text style={styles.modeBadgeText}>{totalProviders}</Text>
                  </View>
                )}
              </LinearGradient>
            ) : (
              <View style={styles.modeInactive}>
                <Ionicons name="storefront-outline" size={18} color={COLORS.text.secondary} />
                <Text style={styles.modeText}>Shops</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Active Filters */}
        {isSearching && (
          <View style={styles.activeFilters}>
            <Ionicons name="funnel" size={14} color={COLORS.primary} />
            <Text style={styles.activeFiltersText}>
              {query && `"${query}"`}
              {query && selectedCategory && ' • '}
              {selectedCategory && categories.find(c => c.id === selectedCategory)?.name}
            </Text>
            <TouchableOpacity onPress={clearSearch} style={styles.clearFiltersBtn}>
              <Text style={styles.clearFiltersText}>Clear</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Categories - Only for services mode */}
        {searchMode === 'services' && categories.length > 0 && (
          <View style={styles.categoriesSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Categories</Text>
              {selectedCategory && (
                <TouchableOpacity onPress={() => setSelectedCategory(null)}>
                  <Text style={styles.clearCategoryText}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.categoriesRow}>
                {categories.map((c) => (
                  <CategoryChip
                    key={c.id}
                    category={c}
                    onPress={() => openCategory(c.id)}
                    isSelected={c.id === selectedCategory}
                  />
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Featured/Popular Section (when not searching) */}
        {!isSearching && searchMode === 'shops' && featuredProviders.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderPadded}>
              <View>
                <Text style={styles.sectionTitle}>Featured Shops</Text>
                <Text style={styles.sectionSubtitle}>Top rated providers</Text>
              </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.horizontalList}>
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
            <View style={styles.sectionHeaderPadded}>
              <View>
                <Text style={styles.sectionTitle}>Popular Services</Text>
                <Text style={styles.sectionSubtitle}>Most booked this week</Text>
              </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.horizontalList}>
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

        {/* Main Results */}
        <View style={styles.resultsSection}>
          <View style={styles.sectionHeaderPadded}>
            <View>
              <Text style={styles.sectionTitle}>
                {isSearching 
                  ? 'Search Results' 
                  : searchMode === 'services' ? 'All Services' : 'All Shops'
                }
              </Text>
              <Text style={styles.sectionSubtitle}>{currentTotal} results</Text>
            </View>
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
            <View style={styles.providersListContainer}>
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
            <View style={styles.emptyState}>
              <LinearGradient
                colors={['#EFF6FF', '#DBEAFE']}
                style={styles.emptyIconContainer}
              >
                <Ionicons
                  name={searchMode === 'services' ? 'briefcase-outline' : 'storefront-outline'}
                  size={40}
                  color={COLORS.primary}
                />
              </LinearGradient>
              <Text style={styles.emptyTitle}>
                No {searchMode === 'services' ? 'services' : 'shops'} found
              </Text>
              <Text style={styles.emptySubtitle}>
                {isSearching
                  ? 'Try adjusting your search or filters'
                  : `Check back later for new ${searchMode}`}
              </Text>

              {isSearching && (
                <TouchableOpacity style={styles.clearButton2} onPress={clearSearch}>
                  <Text style={styles.clearButtonText}>Clear Filters</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {searching && (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.loadingMoreText}>Loading...</Text>
            </View>
          )}

          {hasMore && !searching && currentData.length > 0 && (
            <TouchableOpacity style={styles.loadMoreButton} onPress={loadMore}>
              <LinearGradient
                colors={['#F9FAFB', '#F3F4F6']}
                style={styles.loadMoreGradient}
              >
                <Text style={styles.loadMoreText}>
                  Load More {searchMode === 'services' ? 'Services' : 'Shops'}
                </Text>
                <Ionicons name="chevron-down" size={18} color={COLORS.primary} />
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// Category Chip Component
const CategoryChip: React.FC<{
  category: Category;
  onPress: () => void;
  isSelected?: boolean;
}> = ({ category, onPress, isSelected = false }) => {
  const icon = (category.icon ?? '').trim();
  const hasIconUrl = looksLikeUrl(icon);

  const iconNode = hasIconUrl ? (
    <Image source={{ uri: icon }} style={styles.chipImage} />
  ) : icon.length > 0 ? (
    <Text style={styles.chipEmoji}>{icon}</Text>
  ) : (
    <Ionicons
      name="construct"
      size={18}
      color={isSelected ? '#FFF' : COLORS.primary}
    />
  );

  return (
    <TouchableOpacity
      style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {isSelected ? (
        <LinearGradient
          colors={[COLORS.primary, COLORS.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.chipGradient}
        >
          <View style={styles.chipIconContainer}>
            {iconNode}
          </View>
          <Text style={styles.chipTextActive} numberOfLines={1}>
            {category.name}
          </Text>
        </LinearGradient>
      ) : (
        <View style={styles.chipInactive}>
          <View style={styles.chipIconContainer}>
            {iconNode}
          </View>
          <Text style={styles.chipText} numberOfLines={1}>
            {category.name}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// Shop Card Component
const ShopCard: React.FC<{ provider: any; onPress: () => void }> = ({ provider, onPress }) => {
  const businessName = provider.business_name || `${provider.first_name} ${provider.last_name}`;
  const avatarUri = provider.business_logo || provider.profile_image;

  return (
    <TouchableOpacity style={styles.shopCard} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.shopImageContainer}>
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={styles.shopImage} />
        ) : (
          <LinearGradient
            colors={[COLORS.primary, COLORS.secondary]}
            style={styles.shopPlaceholder}
          >
            <Text style={styles.shopPlaceholderText}>
              {businessName.charAt(0).toUpperCase()}
            </Text>
          </LinearGradient>
        )}
        <View style={styles.shopBadge}>
          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
        </View>
      </View>

      <View style={styles.shopInfo}>
        <Text style={styles.shopName} numberOfLines={1}>
          {businessName}
        </Text>
        {provider.country && (
          <View style={styles.shopMeta}>
            <Ionicons name="location" size={12} color={COLORS.text.secondary} />
            <Text style={styles.shopMetaText} numberOfLines={1}>
              {provider.country}
            </Text>
          </View>
        )}
        <View style={styles.shopServicesBadge}>
          <Ionicons name="briefcase" size={10} color={COLORS.primary} />
          <Text style={styles.shopServicesBadgeText}>{provider.service_count} services</Text>
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
    <TouchableOpacity style={styles.providerCard} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.providerContent}>
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={styles.providerAvatar} />
        ) : (
          <LinearGradient
            colors={[COLORS.primary, COLORS.secondary]}
            style={styles.providerAvatarPlaceholder}
          >
            <Text style={styles.providerPlaceholderText}>
              {businessName.charAt(0).toUpperCase()}
            </Text>
          </LinearGradient>
        )}

        <View style={styles.providerInfo}>
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
                <Ionicons name="location" size={12} color={COLORS.text.secondary} />
                <Text style={styles.metaText}>{provider.country}</Text>
              </View>
            )}
            <View style={styles.metaItem}>
              <Ionicons name="briefcase" size={12} color={COLORS.primary} />
              <Text style={styles.metaText}>{provider.service_count} services</Text>
            </View>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={20} color={COLORS.text.light} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },

  // Header
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
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
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.danger,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  // Search
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text.primary,
  },
  clearButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Mode Toggle
  modeContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  modeButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  modeButtonActive: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  modeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 8,
  },
  modeInactive: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    gap: 8,
  },
  modeText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text.secondary,
  },
  modeTextActive: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modeBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  modeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Active Filters
  activeFilters: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginHorizontal: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    gap: 8,
  },
  activeFiltersText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  clearFiltersBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  clearFiltersText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },

  // Categories
  categoriesSection: {
    paddingVertical: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: COLORS.text.secondary,
  },
  clearCategoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  categoriesRow: {
    flexDirection: 'row',
    paddingLeft: 20,
    gap: 10,
  },
  categoryChip: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  categoryChipActive: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  chipGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 10,
  },
  chipInactive: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    gap: 10,
  },
  chipIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  chipImage: {
    width: '100%',
    height: '100%',
  },
  chipEmoji: {
    fontSize: 16,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  chipTextActive: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Sections
  section: {
    marginBottom: 24,
  },
  sectionHeaderPadded: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  horizontalList: {
    flexDirection: 'row',
    paddingLeft: 20,
  },

  // Shop Cards
  shopCard: {
    width: 160,
    marginRight: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  shopImageContainer: {
    position: 'relative',
  },
  shopImage: {
    width: '100%',
    height: 120,
  },
  shopPlaceholder: {
    width: '100%',
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopPlaceholderText: {
    fontSize: 40,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  shopBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  shopInfo: {
    padding: 14,
  },
  shopName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 6,
  },
  shopMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  shopMetaText: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  shopServicesBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  shopServicesBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // Popular Services
  popularCard: {
    width: 220,
    marginRight: 16,
  },

  // Results Section
  resultsSection: {
    marginTop: 24,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  gridCard: {
    width: '48%',
    marginHorizontal: 0,
    marginBottom: 16,
  },

  // Provider Cards
  providersListContainer: {
    paddingHorizontal: 20,
  },
  providerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
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
  providerPlaceholderText: {
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
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  clearButton2: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  loadingMore: {
    paddingVertical: 20,
    alignItems: 'center',
    gap: 8,
  },
  loadingMoreText: {
    fontSize: 13,
    color: COLORS.text.secondary,
  },

  // Load More
  loadMoreButton: {
    marginHorizontal: 20,
    marginVertical: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  loadMoreGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
});