// src/screens/home/HomeScreen.tsx
import React, { useMemo, useState } from 'react';
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
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

import { useAuth } from '../../context/AuthContext';
import { AuthModal } from '../../components/auth/AuthModal';
import { COLORS, SIZES } from '../../constants/colors';
import { Service } from '../../types';
import { HomeCategoryPill } from '../../services/categories';

// ✅ NEW: Import React Query hooks
import { useServices, usePrefetchService } from '../../hooks/useServices';
import { useHomeCategoryPills } from '../../hooks/useCategories';
import { useProviders, usePrefetchProvider } from '../../hooks/useProviders';
import { useUnreadNotificationsCount } from '../../hooks/useNotifications';

const { width } = Dimensions.get('window');

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { isAuthenticated, user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // ✅ NEW: React Query hooks - replaces all manual state management!
  const { 
    data: pills = [], 
    isLoading: pillsLoading 
  } = useHomeCategoryPills(6);

  const { 
    data: services = [], 
    isLoading: servicesLoading, 
    error: servicesError,
    refetch: refetchServices 
  } = useServices({ limit: 6, offset: 0 });

  const { 
    data: providers = [], 
    isLoading: providersLoading,
    refetch: refetchProviders 
  } = useProviders(6);

  const { 
    data: unreadNotificationsCount = 0,
    refetch: refetchNotifications 
  } = useUnreadNotificationsCount(isAuthenticated);

  // ✅ NEW: Prefetch functions for instant navigation
  const prefetchService = usePrefetchService();
  const prefetchProvider = usePrefetchProvider();

  // ✅ SIMPLIFIED: Pull-to-refresh now just calls refetch()
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refetchServices(),
      refetchProviders(),
      refetchNotifications(),
    ]);
    setRefreshing(false);
  };

  const goToExplore = () => {
    navigation.navigate('Search');
  };

  const onPillPress = (pill: HomeCategoryPill) => {
    if (pill.kind === 'more') {
      return navigation.navigate('Search');
    }

    if (pill.kind === 'all') {
      return navigation.navigate('Search', { 
        initialCategory: null,
        searchMode: 'services' 
      });
    }

    return navigation.navigate('Search', { 
      initialCategory: pill.id,
      categoryName: pill.name,
      searchMode: 'services' 
    });
  };

  const onServicePress = (serviceId: string) => {
    // ✅ NEW: Prefetch before navigation for instant load
    prefetchService(serviceId);
    navigation.navigate('ServiceDetails', { serviceId });
  };

  const onProviderPress = (providerId: string) => {
    // ✅ NEW: Prefetch before navigation for instant load
    prefetchProvider(providerId);
    navigation.navigate('ProviderDetails', { providerId });
  };

  const greetingText = useMemo(() => {
    const hour = new Date().getHours();
    let timeGreeting = 'Good morning';
    if (hour >= 12 && hour < 18) timeGreeting = 'Good afternoon';
    else if (hour >= 18) timeGreeting = 'Good evening';

    if (!isAuthenticated) return timeGreeting;
    const name = user?.first_name || '';
    return name ? `${timeGreeting}, \n${name}` : timeGreeting;
  }, [isAuthenticated, user?.first_name]);

  // Convert error to string
  const servicesErrorMessage = servicesError 
    ? 'Failed to load services' 
    : null;

  const renderPill = ({ item }: { item: HomeCategoryPill }) => {
    const iconUrl = item.kind === 'category' ? (item.icon || '').trim() : '';
    const hasIconUrl = iconUrl.length > 0 && /^https?:\/\//i.test(iconUrl);

    const iconNode =
      item.kind === 'more' ? (
        <Ionicons name="grid" size={20} color={COLORS.primary} />
      ) : item.kind === 'all' ? (
        <Ionicons name="apps" size={20} color={COLORS.primary} />
      ) : hasIconUrl ? (
        <Image source={{ uri: iconUrl }} style={styles.pillIconImage} resizeMode="cover" />
      ) : (
        <Ionicons name="construct" size={20} color={COLORS.primary} />
      );

    return (
      <TouchableOpacity 
        style={styles.pill} 
        onPress={() => onPillPress(item)} 
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={['#F0F9FF', '#E0F2FE']}
          style={styles.pillGradient}
        >
          <View style={styles.pillIconContainer}>{iconNode}</View>
          <Text numberOfLines={1} style={styles.pillText}>
            {item.name}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const ShopCard = ({ item }: { item: any }) => {
  const businessName = item.business_name || `${item.first_name} ${item.last_name}`;
  const avatarUri = item.business_logo || item.profile_image;

  return (
    <TouchableOpacity 
      style={styles.shopCard} 
      onPress={() => onProviderPress(item.id)} 
      activeOpacity={0.8}
    >
      <View style={styles.shopImageContainer}>
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={styles.shopAvatar} />
        ) : (
          <LinearGradient
            colors={[COLORS.primary, COLORS.secondary]}
            style={styles.shopAvatarPlaceholder}
          >
            <Text style={styles.shopAvatarText}>{businessName.charAt(0).toUpperCase()}</Text>
          </LinearGradient>
        )}
        {/* ✅ REMOVED: The check mark badge */}
        {/* {item.service_count > 0 && (
          <View style={styles.shopBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
          </View>
        )} */}
      </View>

      <View style={styles.shopInfo}>
        <Text style={styles.shopName} numberOfLines={1}>
          {businessName}
        </Text>
        {item.country && (
          <View style={styles.shopMeta}>
            <Ionicons name="location" size={12} color={COLORS.text.secondary} />
            <Text style={styles.shopMetaText} numberOfLines={1}>
              {item.country}
            </Text>
          </View>
        )}
        <View style={styles.shopServices}>
          <View style={styles.servicesBadge}>
            <Ionicons name="briefcase" size={10} color={COLORS.primary} />
            <Text style={styles.servicesBadgeText}>{item.service_count} services</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

  const ServiceCard = ({ item }: { item: any }) => {
    const imageUrl = Array.isArray(item.images) ? item.images?.[0] : item.images?.[0];

    return (
      <TouchableOpacity 
        style={styles.serviceCard} 
        onPress={() => onServicePress(item.id)} 
        activeOpacity={0.8}
      >
        <View style={styles.serviceImageContainer}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.serviceImage} />
          ) : (
            <LinearGradient
              colors={['#F0F9FF', '#E0F2FE']}
              style={styles.servicePlaceholder}
            >
              <Ionicons name="image-outline" size={32} color={COLORS.primary} />
            </LinearGradient>
          )}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.6)']}
            style={styles.serviceGradientOverlay}
          />
          <View style={styles.servicePriceTag}>
            <Text style={styles.servicePriceText}>QAR {Number(item.base_price).toFixed(0)}</Text>
          </View>
        </View>

        <View style={styles.serviceInfo}>
          <Text style={styles.serviceTitle} numberOfLines={2}>
            {item.title}
          </Text>

          {item.duration_minutes && (
            <View style={styles.serviceMeta}>
              <Ionicons name="time-outline" size={12} color={COLORS.text.secondary} />
              <Text style={styles.serviceMetaText}>{item.duration_minutes} min</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
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
        {/* Header with Enhanced Design */}
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={[COLORS.primary, COLORS.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            <View style={styles.headerContent}>
              <View style={styles.greetingContainer}>
                <Text style={styles.greeting}>{greetingText}</Text>
                <Text style={styles.subtitle}>Discover trusted services near you</Text>
              </View>

              <View style={styles.headerActions}>
                {/* Only show notifications for authenticated users */}
                {isAuthenticated && (
                  <TouchableOpacity
                    style={styles.notificationBtn}
                    onPress={() => navigation.navigate('Notifications')}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={['#FFFFFF', '#F8FAFC']}
                      style={styles.notificationBtnGradient}
                    >
                      <Ionicons name="notifications-outline" size={20} color={COLORS.primary} />
                      {unreadNotificationsCount > 0 && (
                        <View style={styles.notificationBadge}>
                          <Text style={styles.notificationBadgeText}>
                            {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                          </Text>
                        </View>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                )}

                {!isAuthenticated && (
                  <TouchableOpacity
                    style={styles.signInBtn}
                    onPress={() => setShowAuthModal(true)}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#FFFFFF', '#F8FAFC']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.signInGradient}
                    >
                      <Text style={styles.signInText}>Sign In</Text>
                      <Ionicons name="log-in-outline" size={16} color={COLORS.primary} />
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Decorative elements */}
            <View style={styles.headerDecoration}>
              <View style={styles.decorationCircle1} />
              <View style={styles.decorationCircle2} />
              <View style={styles.decorationCircle3} />
            </View>
          </LinearGradient>
        </View>

        {/* Hero Banner */}
        <View style={styles.heroContainer}>
          <LinearGradient
            colors={['#F0F9FF', '#E0F2FE']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroBanner}
          >
            <View style={styles.heroContentWrapper}>
              <View style={styles.heroContent}>
                <Text style={styles.heroTitle}>Book Services{'\n'}in Minutes</Text>
                <Text style={styles.heroSubtitle}>
                  Compare, check details, and book instantly with trusted providers
                </Text>

                <TouchableOpacity 
                  style={styles.heroBtn} 
                  onPress={goToExplore} 
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={[COLORS.primary, COLORS.secondary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.heroBtnGradient}
                  >
                    <Text style={styles.heroBtnText}>Explore Services</Text>
                    <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              <View style={styles.heroIllustration}>
                <View style={styles.floatingIcon1}>
                  <Ionicons name="leaf" size={24} color={COLORS.primary} />
                </View>
                <View style={styles.floatingIcon2}>
                  <Ionicons name="sparkles" size={20} color={COLORS.primary} />
                </View>
                <View style={styles.floatingIcon3}>
                  <Ionicons name="water" size={18} color={COLORS.primary} />
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Browse Categories</Text>
              <Text style={styles.sectionSubtitle}>Find the service you need</Text>
            </View>
            {pillsLoading && <ActivityIndicator color={COLORS.primary} size="small" />}
          </View>

          <FlatList
            data={pills}
            keyExtractor={(item) => item.id}
            renderItem={renderPill}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pillsList}
          />
        </View>

        {/* Featured Providers */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Top Rated Providers</Text>
              <Text style={styles.sectionSubtitle}>Trusted professionals near you</Text>
            </View>
            <TouchableOpacity onPress={goToExplore} activeOpacity={0.7}>
              <Text style={styles.seeAllText}>See All →</Text>
            </TouchableOpacity>
          </View>

          {providersLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={COLORS.primary} size="large" />
            </View>
          ) : providers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="business-outline" size={48} color={COLORS.text.light} />
              <Text style={styles.emptyText}>No providers available yet</Text>
            </View>
          ) : (
            <FlatList
              data={providers}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <ShopCard item={item} />}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.shopsList}
            />
          )}
        </View>

        {/* Popular Services */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Popular Services</Text>
              <Text style={styles.sectionSubtitle}>Most booked this week</Text>
            </View>
            <TouchableOpacity onPress={goToExplore} activeOpacity={0.7}>
              <Text style={styles.seeAllText}>See All →</Text>
            </TouchableOpacity>
          </View>

          {servicesLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={COLORS.primary} size="large" />
            </View>
          ) : servicesErrorMessage ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={48} color={COLORS.danger} />
              <Text style={styles.errorText}>{servicesErrorMessage}</Text>
            </View>
          ) : services.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="briefcase-outline" size={48} color={COLORS.text.light} />
              <Text style={styles.emptyText}>No services available</Text>
            </View>
          ) : (
            <FlatList
              data={services}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <ServiceCard item={item} />}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.servicesList}
            />
          )}
        </View>

        {/* How It Works */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>How Call To Clean Works</Text>
              <Text style={styles.sectionSubtitle}>Simple steps to get started</Text>
            </View>
          </View>

          <View style={styles.stepsContainer}>
            <View style={styles.stepCard}>
              <LinearGradient
                colors={['#EFF6FF', '#DBEAFE']}
                style={styles.stepIconContainer}
              >
                <Ionicons name="search" size={24} color={COLORS.primary} />
              </LinearGradient>
              <Text style={styles.stepNumber}>01</Text>
              <Text style={styles.stepTitle}>Search</Text>
              <Text style={styles.stepText}>
                Browse services and find the perfect provider for your needs
              </Text>
            </View>

            <View style={styles.stepCard}>
              <LinearGradient
                colors={['#F0FDF4', '#DCFCE7']}
                style={styles.stepIconContainer}
              >
                <Ionicons name="calendar" size={24} color="#10B981" />
              </LinearGradient>
              <Text style={styles.stepNumber}>02</Text>
              <Text style={styles.stepTitle}>Book</Text>
              <Text style={styles.stepText}>
                Choose your preferred time and confirm your booking instantly
              </Text>
            </View>

            <View style={styles.stepCard}>
              <LinearGradient
                colors={['#FEF3C7', '#FDE68A']}
                style={styles.stepIconContainer}
              >
                <Ionicons name="checkmark-done" size={24} color="#F59E0B" />
              </LinearGradient>
              <Text style={styles.stepNumber}>03</Text>
              <Text style={styles.stepTitle}>Enjoy</Text>
              <Text style={styles.stepText}>
                Relax while our trusted provider completes your service
              </Text>
            </View>
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>

      <AuthModal 
        visible={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        initialMode="login" 
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },

  // Header with Gradient
  // Header with Enhanced Design
  headerContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  headerGradient: {
    paddingTop: 28,
    paddingBottom: 28,
    paddingHorizontal: 24,
    position: 'relative',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    position: 'relative',
    zIndex: 2,
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.95)',
    lineHeight: 20,
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 4,
  },
  notificationBtn: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  notificationBtnGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: COLORS.secondary,
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 14,
  },
  signInBtn: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  signInGradient: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 20,
  },
  signInText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  headerDecoration: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  decorationCircle1: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  decorationCircle2: {
    position: 'absolute',
    bottom: -30,
    left: -30,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  decorationCircle3: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  
  // Hero Banner - Fixed spacing and layout
  heroContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  heroBanner: {
    borderRadius: 24,
    padding: 24,
    overflow: 'hidden',
  },
  heroContentWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  heroContent: {
    flex: 1,
    paddingRight: 20,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text.primary,
    marginBottom: 8,
    lineHeight: 36,
  },
  heroSubtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  heroBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    alignSelf: 'flex-start',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  heroBtnGradient: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  heroIllustration: {
    width: 80,
    height: 160,
    position: 'relative',
  },
  floatingIcon1: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  floatingIcon2: {
    position: 'absolute',
    top: 60,
    right: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  floatingIcon3: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },

  // Sections
  section: {
    marginTop: 32,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: COLORS.text.secondary,
  },
  seeAllText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },

  // Category Pills
  pillsList: {
    paddingRight: 20,
  },
  pill: {
    marginRight: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  pillGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 10,
  },
  pillIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillIconImage: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text.primary,
  },

  // Shop Cards - Enhanced Visibility
  shopsList: {
    paddingRight: 20,
  },
  shopCard: {
    width: 160,
    marginRight: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  shopImageContainer: {
    position: 'relative',
  },
  shopAvatar: {
    width: '100%',
    height: 120,
  },
  shopAvatarPlaceholder: {
    width: '100%',
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopAvatarText: {
    fontSize: 40,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  shopBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
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
  shopServices: {
    marginTop: 4,
  },
  servicesBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  servicesBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // Service Cards - Enhanced Visibility
  servicesList: {
    paddingRight: 20,
  },
  serviceCard: {
    width: 220,
    marginRight: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  serviceImageContainer: {
    position: 'relative',
    width: '100%',
    height: 140,
  },
  serviceImage: {
    width: '100%',
    height: '100%',
  },
  servicePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceGradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  servicePriceTag: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  servicePriceText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
  },
  serviceInfo: {
    padding: 14,
  },
  serviceTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 8,
    lineHeight: 20,
  },
  serviceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  serviceMetaText: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },

  // Steps
  stepsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  stepCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  stepIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 8,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 6,
  },
  stepText: {
    fontSize: 12,
    color: COLORS.text.secondary,
    lineHeight: 18,
  },

  // Loading & Empty States
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginTop: 12,
  },
  errorContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: COLORS.danger,
    marginTop: 12,
    textAlign: 'center',
  },
});