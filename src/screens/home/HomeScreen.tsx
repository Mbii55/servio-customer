// src/screens/home/HomeScreen.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { useAuth } from '../../context/AuthContext';
import { AuthModal } from '../../components/auth/AuthModal';
import { COLORS, SIZES } from '../../constants/colors';
import { listServices } from '../../services/services';
import api from '../../services/api';
import { Service } from '../../types';
import { getHomeCategoryPills, HomeCategoryPill, ALL_CATEGORY_ID } from '../../services/categories';

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { isAuthenticated, user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [pills, setPills] = useState<HomeCategoryPill[]>([]);
  const [pillsLoading, setPillsLoading] = useState(true);

  const [services, setServices] = useState<Service[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState<string | null>(null);

  const [providers, setProviders] = useState<any[]>([]);
  const [providersLoading, setProvidersLoading] = useState(false);

  const [refreshing, setRefreshing] = useState(false);

  const goToExplore = () => {
    navigation.navigate('Search');
  };

  const goToSearch = (opts?: { categoryId?: string; categoryName?: string }) => {
    navigation.navigate('Search', {
      categoryId: opts?.categoryId,
      categoryName: opts?.categoryName,
    });
  };

const onPillPress = (pill: HomeCategoryPill) => {
  if (pill.kind === 'more') {
    // Navigate to explore without any pre-selection
    return navigation.navigate('Search');
  }

  if (pill.kind === 'all') {
    // Navigate to explore with "all" selected (shows everything)
    return navigation.navigate('Search', { 
      initialCategory: null,
      searchMode: 'services' 
    });
  }

  // Navigate to explore with specific category pre-selected
  return navigation.navigate('Search', { 
    initialCategory: pill.id,
    categoryName: pill.name,
    searchMode: 'services' 
  });
};

  const onServicePress = (serviceId: string) => {
    navigation.navigate('ServiceDetails', { serviceId });
  };

  const onProviderPress = (providerId: string) => {
    navigation.navigate('ProviderDetails', { providerId });
  };

  const loadPills = useCallback(async () => {
    setPillsLoading(true);
    try {
      const data = await getHomeCategoryPills(6);
      setPills(data);
    } catch {
      setPills([
        { kind: 'all', id: ALL_CATEGORY_ID, name: 'All', icon: null },
        { kind: 'more', id: 'more', name: 'More', icon: null },
      ]);
    } finally {
      setPillsLoading(false);
    }
  }, []);

  const loadServices = useCallback(async () => {
    setServicesLoading(true);
    setServicesError(null);
    try {
      const data = await listServices({ limit: 6, offset: 0 });
      setServices(data);
    } catch (e: any) {
      setServicesError(e?.response?.data?.error || e?.message || 'Failed to load services');
      setServices([]);
    } finally {
      setServicesLoading(false);
    }
  }, []);

  const loadProviders = useCallback(async () => {
    setProvidersLoading(true);
    try {
      const res = await api.get('/search?limit=6');
      const data = res.data;
      setProviders(data.providers?.items || []);
    } catch (error) {
      console.error('Load providers error:', error);
      setProviders([]);
    } finally {
      setProvidersLoading(false);
    }
  }, []);

  const loadAll = useCallback(async () => {
    await Promise.all([loadPills(), loadServices(), loadProviders()]);
  }, [loadPills, loadServices, loadProviders]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  }, [loadAll]);

  const greetingText = useMemo(() => {
    if (!isAuthenticated) return 'Welcome to Servio';
    const name = [user?.first_name, user?.last_name].filter(Boolean).join(' ');
    return name ? `Hi, ${name}` : 'Welcome back!';
  }, [isAuthenticated, user?.first_name, user?.last_name]);

  const renderPill = ({ item }: { item: HomeCategoryPill }) => {
    const iconUrl = item.kind === 'category' ? (item.icon || '').trim() : '';
    const hasIconUrl = iconUrl.length > 0 && /^https?:\/\//i.test(iconUrl);

    const iconNode =
      item.kind === 'more' ? (
        <Ionicons name="chevron-forward-outline" size={18} color={COLORS.primary} />
      ) : item.kind === 'all' ? (
        <Ionicons name="apps-outline" size={18} color={COLORS.primary} />
      ) : hasIconUrl ? (
        <Image source={{ uri: iconUrl }} style={styles.pillIconImage} resizeMode="cover" />
      ) : (
        <Ionicons name="grid-outline" size={18} color={COLORS.primary} />
      );

    return (
      <TouchableOpacity style={styles.pill} onPress={() => onPillPress(item)} activeOpacity={0.85}>
        <View style={styles.pillIcon}>{iconNode}</View>
        <Text numberOfLines={1} style={styles.pillText}>
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  const ShopCard = ({ item }: { item: any }) => {
    const businessName = item.business_name || `${item.first_name} ${item.last_name}`;
    const avatarUri = item.business_logo || item.profile_image;

    return (
      <TouchableOpacity style={styles.shopCard} onPress={() => onProviderPress(item.id)} activeOpacity={0.85}>
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
          {item.country && (
            <View style={styles.shopLocation}>
              <Ionicons name="location-outline" size={11} color={COLORS.text.secondary} />
              <Text style={styles.shopLocationText} numberOfLines={1}>
                {item.country}
              </Text>
            </View>
          )}
          <View style={styles.shopServices}>
            <Ionicons name="briefcase-outline" size={11} color={COLORS.primary} />
            <Text style={styles.shopServicesText}>{item.service_count} services</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const ServiceCard = ({ item }: { item: any }) => {
    const imageUrl = Array.isArray(item.images) ? item.images?.[0] : item.images?.[0];

    return (
      <TouchableOpacity style={styles.serviceCard} onPress={() => onServicePress(item.id)} activeOpacity={0.85}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.serviceImage} />
        ) : (
          <View style={[styles.serviceImage, styles.servicePlaceholder]}>
            <Ionicons name="image-outline" size={22} color={COLORS.text.secondary} />
          </View>
        )}

        <View style={styles.serviceInfo}>
          <Text style={styles.serviceTitle} numberOfLines={1}>
            {item.title}
          </Text>

          <Text style={styles.serviceDuration} numberOfLines={1}>
            {item.duration_minutes ? `${item.duration_minutes} min` : 'Flexible duration'}
          </Text>

          <Text style={styles.servicePrice} numberOfLines={1}>
            QAR {Number(item.base_price).toFixed(2)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>{greetingText}</Text>
            <Text style={styles.subtitle}>Find trusted services near you</Text>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => navigation.navigate('Notifications')}
              activeOpacity={0.85}
            >
              <Ionicons name="notifications-outline" size={22} color={COLORS.text.primary} />
              <View style={styles.badgeDot} />
            </TouchableOpacity>

            {!isAuthenticated && (
              <TouchableOpacity
                style={styles.signInButton}
                onPress={() => setShowAuthModal(true)}
                activeOpacity={0.85}
              >
                <Text style={styles.signInButtonText}>Sign In</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Promo Banner */}
        <View style={styles.promo}>
          <View style={{ flex: 1 }}>
            <Text style={styles.promoTitle}>Book in minutes</Text>
            <Text style={styles.promoText} numberOfLines={2}>
              Compare services, check details, and book instantly.
            </Text>

            <TouchableOpacity style={styles.promoBtn} onPress={goToExplore} activeOpacity={0.85}>
              <Text style={styles.promoBtnText}>Explore</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.promoIconWrap}>
            <Ionicons name="sparkles-outline" size={40} color={COLORS.primary} />
          </View>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Categories</Text>
            {pillsLoading && <ActivityIndicator color={COLORS.primary} size="small" />}
          </View>

          <FlatList
            data={pills}
            keyExtractor={(item) => item.id}
            renderItem={renderPill}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pillsRow}
          />
        </View>

        {/* Featured Shops */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Shops</Text>
            <TouchableOpacity onPress={goToExplore} activeOpacity={0.85}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {providersLoading ? (
            <View style={{ paddingVertical: 18 }}>
              <ActivityIndicator color={COLORS.primary} />
            </View>
          ) : providers.length === 0 ? (
            <Text style={styles.emptyText}>No shops available yet.</Text>
          ) : (
            <FlatList
              data={providers}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <ShopCard item={item} />}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: 2 }}
            />
          )}
        </View>

        {/* Recommended Services */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recommended for you</Text>
            <TouchableOpacity onPress={goToExplore} activeOpacity={0.85}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {servicesLoading ? (
            <View style={{ paddingVertical: 18 }}>
              <ActivityIndicator color={COLORS.primary} />
            </View>
          ) : servicesError ? (
            <Text style={styles.inlineError}>{servicesError}</Text>
          ) : services.length === 0 ? (
            <Text style={styles.emptyText}>No services available.</Text>
          ) : (
            <FlatList
              data={services}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <ServiceCard item={item} />}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: 2 }}
            />
          )}
        </View>

        {/* How it works */}
        <View style={[styles.section, { marginBottom: 18 }]}>
          <Text style={styles.sectionTitle}>How it works</Text>

          <View style={styles.stepsRow}>
            <View style={styles.stepCard}>
              <View style={styles.stepIcon}>
                <Ionicons name="search-outline" size={18} color={COLORS.primary} />
              </View>
              <Text style={styles.stepTitle}>Discover</Text>
              <Text style={styles.stepText} numberOfLines={2}>
                Browse categories and find the right service.
              </Text>
            </View>

            <View style={styles.stepCard}>
              <View style={styles.stepIcon}>
                <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
              </View>
              <Text style={styles.stepTitle}>Book</Text>
              <Text style={styles.stepText} numberOfLines={2}>
                Choose time and confirm in a few taps.
              </Text>
            </View>

            <View style={styles.stepCard}>
              <View style={styles.stepIcon}>
                <Ionicons name="checkmark-done-outline" size={18} color={COLORS.primary} />
              </View>
              <Text style={styles.stepTitle}>Done</Text>
              <Text style={styles.stepText} numberOfLines={2}>
                Provider completes the job, you're all set.
              </Text>
            </View>
          </View>
        </View>

        <View style={{ height: 18 }} />
      </ScrollView>

      <AuthModal visible={showAuthModal} onClose={() => setShowAuthModal(false)} initialMode="login" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background.secondary },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.padding,
    backgroundColor: COLORS.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  greeting: { fontSize: SIZES.h3, fontWeight: 'bold', color: COLORS.text.primary },
  subtitle: { fontSize: SIZES.small, color: COLORS.text.secondary, marginTop: 4 },

  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: COLORS.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  badgeDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.danger,
  },

  signInButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: SIZES.radius,
  },
  signInButtonText: { color: '#FFFFFF', fontSize: SIZES.small, fontWeight: '700' },

  promo: {
    marginHorizontal: SIZES.padding,
    marginTop: 14,
    padding: 16,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.background.primary,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  promoTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text.primary },
  promoText: { marginTop: 6, fontSize: 13, color: COLORS.text.secondary, lineHeight: 18 },
  promoBtn: {
    marginTop: 10,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  promoBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  promoIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  section: { marginTop: 18, paddingHorizontal: SIZES.padding },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: SIZES.h4, fontWeight: 'bold', color: COLORS.text.primary },
  seeAll: { fontSize: SIZES.small, color: COLORS.primary, fontWeight: '700' },

  inlineError: { color: COLORS.danger, fontSize: SIZES.small, marginTop: 6 },
  emptyText: { color: COLORS.text.secondary, fontSize: SIZES.small },

  pillsRow: { paddingVertical: 4, gap: 10 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.primary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginRight: 10,
    maxWidth: 150,
  },
  pillIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginRight: 8,
  },
  pillIconImage: { width: '100%', height: '100%' },
  pillText: {
    fontSize: SIZES.small,
    fontWeight: '800',
    color: COLORS.text.primary,
  },

  // Shop Cards
  shopCard: {
    width: 140,
    marginRight: 12,
    backgroundColor: COLORS.background.primary,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  shopAvatar: {
    width: '100%',
    height: 110,
  },
  shopAvatarPlaceholder: {
    width: '100%',
    height: 110,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shopAvatarText: {
    fontSize: 36,
    fontWeight: '600',
    color: '#fff',
  },
  shopInfo: {
    padding: 12,
  },
  shopName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 5,
  },
  shopLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 5,
  },
  shopLocationText: {
    fontSize: 11,
    color: COLORS.text.secondary,
  },
  shopServices: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  shopServicesText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // Service Cards
  serviceCard: {
    width: 200,
    marginRight: 12,
    backgroundColor: COLORS.background.primary,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  serviceImage: { width: '100%', height: 110, backgroundColor: COLORS.background.secondary },
  servicePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  serviceInfo: { padding: 12 },
  serviceTitle: { fontSize: 13.5, fontWeight: '800', color: COLORS.text.primary },
  serviceDuration: { marginTop: 4, fontSize: 12, color: COLORS.text.secondary },
  servicePrice: { marginTop: 7, fontSize: 13, fontWeight: '900', color: COLORS.primary },

  stepsRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  stepCard: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
  },
  stepIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: COLORS.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stepTitle: { marginTop: 10, fontSize: 13, fontWeight: '900', color: COLORS.text.primary },
  stepText: { marginTop: 5, fontSize: 12.5, color: COLORS.text.secondary, lineHeight: 17 },
});