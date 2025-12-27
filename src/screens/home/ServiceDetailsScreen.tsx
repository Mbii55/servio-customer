// src/screens/home/ServiceDetailsScreen.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  SafeAreaView,
  Share,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { COLORS, SIZES } from '../../constants/colors';
import { getServiceById } from '../../services/services';
import { Service, ServiceAddon } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { AuthModal } from '../../components/auth/AuthModal';
import api from '../../services/api';
import { HomeStackParamList } from '../../navigation/types';
import { getFavoriteStatus, toggleFavorite } from '../../services/favorites';

type Params = { serviceId: string };
type NavProp = NativeStackNavigationProp<HomeStackParamList>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_HEIGHT = 280;

export const ServiceDetailsScreen: React.FC = () => {
  const route = useRoute<RouteProp<Record<string, Params>, string>>();
  const navigation = useNavigation<NavProp>();
  const { serviceId } = route.params;

  const { isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [service, setService] = useState<Service | null>(null);
  const [addons, setAddons] = useState<ServiceAddon[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  const [activeIndex, setActiveIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<Record<number, boolean>>({});
  const galleryRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadServiceData();
  }, [serviceId]);

  const loadServiceData = async () => {
    setErr(null);
    setLoading(true);

    try {
      const [serviceData, addonsData] = await Promise.all([
        getServiceById(serviceId),
        loadAddons(serviceId),
      ]);
      
      setService(serviceData);
      setAddons(addonsData);
      setActiveIndex(0);
      setFailedImages({});
    } catch (e: any) {
      setErr(e?.response?.data?.error || e?.message || 'Failed to load service');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  const loadFav = async () => {
    if (!isAuthenticated) {
      setIsFavorite(false);
      return;
    }
    try {
      const s = await getFavoriteStatus(serviceId);
      setIsFavorite(!!s.is_favorite);
    } catch {
      // ignore status errors
    }
  };

  loadFav();
}, [isAuthenticated, serviceId]);


  const loadAddons = async (serviceId: string): Promise<ServiceAddon[]> => {
    try {
      const response = await api.get(`/addons/service/${serviceId}`);
      return response.data || [];
    } catch (error) {
      console.error('Failed to load addons:', error);
      return [];
    }
  };

  const images = useMemo(() => {
    const arr = service?.images ?? [];
    if (!arr || arr.length === 0) return [];
    return arr.filter((u) => typeof u === 'string' && u.trim().length > 0);
  }, [service?.images]);

  const hasImages = images.length > 0;

  const priceText = useMemo(() => {
    const v = Number(service?.base_price ?? 0);
    if (Number.isFinite(v)) return `QAR ${v.toFixed(2)}`;
    return `QAR ${service?.base_price ?? ''}`;
  }, [service?.base_price]);

  const activeAddons = useMemo(() => {
    return addons.filter((a) => a.is_active);
  }, [addons]);

    const onBookPress = () => {
    if (!isAuthenticated) {
        setShowAuthModal(true);
        return;
    }
    
    // Navigate to BookService screen
    navigation.navigate('BookService', { serviceId });
    };

  const onSharePress = async () => {
    try {
      await Share.share({
        message: `Check out ${service?.title} on Servio!\n\nPrice: ${priceText}`,
        title: service?.title,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const onFavoritePress = async () => {
  if (!isAuthenticated) {
    setShowAuthModal(true);
    return;
  }

  // optimistic UI
  const prev = isFavorite;
  setIsFavorite(!prev);

  try {
    const r = await toggleFavorite(serviceId);
    setIsFavorite(r.is_favorite);
  } catch (e: any) {
    setIsFavorite(prev);
    Alert.alert('Error', e?.message || 'Failed to update favorite');
  }
};


  const onGalleryScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const idx = Math.round(x / SCREEN_WIDTH);
    setActiveIndex(idx);
  };

  const goToImage = (idx: number) => {
    setActiveIndex(idx);
    galleryRef.current?.scrollTo({ x: idx * SCREEN_WIDTH, y: 0, animated: true });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading service...</Text>
      </View>
    );
  }

  if (err || !service) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={64} color={COLORS.danger} />
        <Text style={styles.errorText}>{err ?? 'Service not found'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadServiceData}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

const provider = service.provider;
const providerId = service.provider_id;
const bp = provider?.business_profile ?? null;

  const shopName =
    bp?.business_name ||
    `${provider?.first_name ?? ''} ${provider?.last_name ?? ''}`.trim() ||
    'Service Provider';

  const shopLogo = bp?.business_logo ?? null;
  const shopDesc = bp?.business_description ?? null;
  const shopPhone = bp?.business_phone ?? provider?.phone ?? null;
  const shopEmail = bp?.business_email ?? null;
  const shopLocation = [bp?.city, bp?.country].filter(Boolean).join(', ');

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Actions */}
      <View style={styles.headerActions}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerButton} onPress={onSharePress}>
            <Ionicons name="share-outline" size={24} color={COLORS.text.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={onFavoritePress}>
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={24}
              color={isFavorite ? COLORS.danger : COLORS.text.primary}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <View style={styles.hero}>
          {hasImages ? (
            <>
              <ScrollView
                ref={galleryRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={onGalleryScrollEnd}
                style={{ width: '100%', height: HERO_HEIGHT }}
              >
                {images.map((uri, idx) => {
                  const failed = !!failedImages[idx];
                  return (
                    <View key={`${uri}-${idx}`} style={{ width: SCREEN_WIDTH, height: HERO_HEIGHT }}>
                      {!failed ? (
                        <Image
                          source={{ uri }}
                          style={styles.heroImage}
                          resizeMode="cover"
                          onError={() => setFailedImages((prev) => ({ ...prev, [idx]: true }))}
                        />
                      ) : (
                        <View style={styles.heroFallback}>
                          <Ionicons name="image-outline" size={48} color={COLORS.text.light} />
                          <Text style={styles.fallbackText}>Image not available</Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </ScrollView>

              {/* Pagination Dots */}
              {images.length > 1 && (
                <View style={styles.dots}>
                  {images.map((_, idx) => (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => goToImage(idx)}
                      activeOpacity={0.7}
                      style={[
                        styles.dot,
                        idx === activeIndex ? styles.dotActive : styles.dotInactive,
                      ]}
                    />
                  ))}
                </View>
              )}
            </>
          ) : (
            <View style={styles.heroFallback}>
              <Ionicons name="image-outline" size={48} color={COLORS.text.light} />
              <Text style={styles.fallbackText}>No images available</Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Title & Price */}
          <Text style={styles.title}>{service.title}</Text>
          <Text style={styles.price}>{priceText}</Text>

          {/* Meta Info */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={18} color={COLORS.text.secondary} />
              <Text style={styles.metaText}>
                {service.duration_minutes ? `${service.duration_minutes} min` : 'Flexible'}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="cash-outline" size={18} color={COLORS.text.secondary} />
              <Text style={styles.metaText}>Cash Payment</Text>
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.desc}>{service.description}</Text>
          </View>

          {/* Add-ons */}
          {activeAddons.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Available Add-ons</Text>
              {activeAddons.map((addon) => (
                <View key={addon.id} style={styles.addonCard}>
                  <View style={styles.addonInfo}>
                    <Text style={styles.addonName}>{addon.name}</Text>
                    {addon.description && (
                      <Text style={styles.addonDesc}>{addon.description}</Text>
                    )}
                  </View>
                  <Text style={styles.addonPrice}>+QAR {Number(addon.price).toFixed(2)}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Provider Card */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Service Provider</Text>
            {provider ? (
              <View style={styles.providerCard}>
                <View style={styles.providerHeader}>
                  <View style={styles.providerRow}>
                    {shopLogo ? (
                      <Image source={{ uri: shopLogo }} style={styles.providerLogo} resizeMode="cover" />
                    ) : (
                      <View style={styles.providerLogoFallback}>
                        <Ionicons name="storefront-outline" size={24} color={COLORS.text.light} />
                      </View>
                    )}

                    <View style={{ flex: 1 }}>
                      <Text style={styles.providerName}>{shopName}</Text>
                      {shopLocation && (
                        <View style={styles.providerLocationRow}>
                          <Ionicons name="location-outline" size={14} color={COLORS.text.secondary} />
                          <Text style={styles.providerLocation}>{shopLocation}</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Rating Placeholder */}
                  {/* <View style={styles.ratingRow}>
                    <Ionicons name="star" size={16} color={COLORS.warning} />
                    <Text style={styles.ratingText}>4.8</Text>
                    <Text style={styles.ratingCount}>(124 reviews)</Text>
                  </View> */}
                </View>

                {shopDesc && <Text style={styles.providerDesc}>{shopDesc}</Text>}

                {/* Contact Info */}
                {(shopPhone || shopEmail) && (
                  <View style={styles.contactSection}>
                    {shopPhone && (
                      <View style={styles.contactRow}>
                        <Ionicons name="call-outline" size={16} color={COLORS.text.secondary} />
                        <Text style={styles.contactText}>{shopPhone}</Text>
                      </View>
                    )}
                    {shopEmail && (
                      <View style={styles.contactRow}>
                        <Ionicons name="mail-outline" size={16} color={COLORS.text.secondary} />
                        <Text style={styles.contactText}>{shopEmail}</Text>
                      </View>
                    )}
                  </View>
                )}

<TouchableOpacity
  style={styles.viewShopButton}
  onPress={() => {
    if (providerId) {
      navigation.navigate('ProviderDetails', { providerId });
    } else {
      Alert.alert('Error', 'Provider information not available');
    }
  }}
  activeOpacity={0.7}
>
  <Text style={styles.viewShopButtonText}>View Shop Profile</Text>
  <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
</TouchableOpacity>
              </View>
            ) : (
              <Text style={styles.providerUnavailable}>Provider information not available</Text>
            )}
          </View>

          {/* Bottom Spacing */}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Sticky Bottom CTA */}
      <View style={styles.bottomBar}>
        <View style={styles.priceInfo}>
          <Text style={styles.bottomPriceLabel}>Total Price</Text>
          <Text style={styles.bottomPrice}>{priceText}</Text>
        </View>
        <TouchableOpacity style={styles.bookButton} onPress={onBookPress} activeOpacity={0.85}>
          <Text style={styles.bookButtonText}>Book Now</Text>
        </TouchableOpacity>
      </View>

      {/* Auth Modal */}
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
    backgroundColor: COLORS.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background.secondary,
    padding: SIZES.padding * 2,
  },
  loadingText: {
    marginTop: 16,
    fontSize: SIZES.body,
    color: COLORS.text.secondary,
  },
  errorText: {
    marginTop: 16,
    fontSize: SIZES.body,
    color: COLORS.danger,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: SIZES.radius,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: SIZES.body,
    fontWeight: '600',
  },

  // Header
  headerActions: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.padding,
    zIndex: 10,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },

  // Hero
  hero: {
    height: HERO_HEIGHT,
    backgroundColor: COLORS.background.tertiary,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroFallback: {
    height: HERO_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  fallbackText: {
    color: COLORS.text.secondary,
    fontSize: SIZES.small,
  },

  // Dots
  dots: {
    position: 'absolute',
    bottom: 16,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: '#FFFFFF',
  },
  dotInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },

  // Content
  content: {
    padding: SIZES.padding,
  },
  title: {
    fontSize: SIZES.h2,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    lineHeight: 32,
  },
  price: {
    marginTop: 8,
    fontSize: SIZES.h3,
    fontWeight: 'bold',
    color: COLORS.primary,
  },

  // Meta
  metaRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: SIZES.small,
    color: COLORS.text.secondary,
  },

  // Sections
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: SIZES.h4,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 12,
  },
  desc: {
    fontSize: SIZES.body,
    color: COLORS.text.secondary,
    lineHeight: 24,
  },

  // Add-ons
  addonCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.background.secondary,
    padding: 12,
    borderRadius: SIZES.radius,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  addonInfo: {
    flex: 1,
  },
  addonName: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  addonDesc: {
    fontSize: SIZES.small,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  addonPrice: {
    fontSize: SIZES.body,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginLeft: 12,
  },

  // Provider Card
  providerCard: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: SIZES.radius,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  providerHeader: {
    marginBottom: 12,
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  providerLogo: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  providerLogoFallback: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  providerName: {
    fontSize: SIZES.body,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  providerLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  providerLocation: {
    fontSize: SIZES.small,
    color: COLORS.text.secondary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: SIZES.small,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  ratingCount: {
    fontSize: SIZES.small,
    color: COLORS.text.secondary,
  },
  providerDesc: {
    fontSize: SIZES.body,
    color: COLORS.text.secondary,
    lineHeight: 22,
    marginBottom: 12,
  },
  contactSection: {
    gap: 8,
    marginBottom: 12,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactText: {
    fontSize: SIZES.small,
    color: COLORS.text.secondary,
  },
  viewShopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.background.primary,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  viewShopButtonText: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.primary,
  },
  providerUnavailable: {
    fontSize: SIZES.body,
    color: COLORS.text.secondary,
    fontStyle: 'italic',
  },

  // Bottom Bar
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.padding,
    paddingVertical: 12,
    backgroundColor: COLORS.background.primary,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  priceInfo: {
    flex: 1,
  },
  bottomPriceLabel: {
    fontSize: SIZES.small,
    color: COLORS.text.secondary,
  },
  bottomPrice: {
    fontSize: SIZES.h4,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  bookButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: SIZES.radius,
  },
  bookButtonText: {
    fontSize: SIZES.body,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});