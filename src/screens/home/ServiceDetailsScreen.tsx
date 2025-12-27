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
  Share,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

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
const HERO_HEIGHT = 320;

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
    if (Number.isFinite(v)) return `${v.toFixed(0)}`;
    return `${service?.base_price ?? ''}`;
  }, [service?.base_price]);

  const activeAddons = useMemo(() => {
    return addons.filter((a) => a.is_active);
  }, [addons]);

  const onBookPress = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    
    navigation.navigate('BookService', { serviceId });
  };

  const onSharePress = async () => {
    try {
      await Share.share({
        message: `Check out ${service?.title} on Servio!\n\nPrice: QAR ${priceText}`,
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
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading service...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (err || !service) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <LinearGradient
            colors={['#FEF2F2', '#FEE2E2']}
            style={styles.errorIconContainer}
          >
            <Ionicons name="alert-circle-outline" size={48} color={COLORS.danger} />
          </LinearGradient>
          <Text style={styles.errorTitle}>{err ?? 'Service not found'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadServiceData}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.retryButtonGradient}
            >
              <Ionicons name="refresh" size={18} color="#FFF" />
              <Text style={styles.retryButtonText}>Try Again</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
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
    <View style={styles.container}>
      {/* Floating Header */}
      <SafeAreaView style={styles.headerSafe}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerButton} onPress={onSharePress}>
              <Ionicons name="share-outline" size={22} color={COLORS.text.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton} onPress={onFavoritePress}>
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={22}
                color={isFavorite ? '#EF4444' : COLORS.text.primary}
              />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Image Gallery */}
        <View style={styles.heroContainer}>
          {hasImages ? (
            <>
              <ScrollView
                ref={galleryRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={onGalleryScrollEnd}
                style={styles.gallery}
              >
                {images.map((uri, idx) => {
                  const failed = !!failedImages[idx];
                  return (
                    <View key={`${uri}-${idx}`} style={styles.imageSlide}>
                      {!failed ? (
                        <Image
                          source={{ uri }}
                          style={styles.heroImage}
                          resizeMode="cover"
                          onError={() => setFailedImages((prev) => ({ ...prev, [idx]: true }))}
                        />
                      ) : (
                        <LinearGradient
                          colors={['#F9FAFB', '#F3F4F6']}
                          style={styles.imageFallback}
                        >
                          <Ionicons name="image-outline" size={48} color={COLORS.text.light} />
                        </LinearGradient>
                      )}
                    </View>
                  );
                })}
              </ScrollView>

              {images.length > 1 && (
                <View style={styles.pagination}>
                  {images.map((_, idx) => (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => goToImage(idx)}
                      activeOpacity={0.7}
                    >
                      <View style={[
                        styles.paginationDot,
                        idx === activeIndex && styles.paginationDotActive,
                      ]} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          ) : (
            <LinearGradient
              colors={['#F9FAFB', '#F3F4F6']}
              style={styles.imageFallback}
            >
              <Ionicons name="image-outline" size={64} color={COLORS.text.light} />
              <Text style={styles.noImageText}>No images available</Text>
            </LinearGradient>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Title & Price Card */}
          <View style={styles.titleCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{service.title}</Text>
              <View style={styles.priceContainer}>
                <Text style={styles.priceLabel}>Starting from</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.price}>QAR {priceText}</Text>
                  <View style={styles.priceBadge}>
                    <Ionicons name="cash" size={14} color="#10B981" />
                    <Text style={styles.priceBadgeText}>Cash</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Quick Info */}
          <View style={styles.quickInfoCard}>
            <View style={styles.quickInfoItem}>
              <View style={styles.quickInfoIcon}>
                <Ionicons name="time" size={18} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.quickInfoLabel}>Duration</Text>
                <Text style={styles.quickInfoValue}>
                  {service.duration_minutes ? `${service.duration_minutes} min` : 'Flexible'}
                </Text>
              </View>
            </View>

            <View style={styles.quickInfoDivider} />

            <View style={styles.quickInfoItem}>
              <View style={styles.quickInfoIcon}>
                <Ionicons name="location" size={18} color="#F59E0B" />
              </View>
              <View>
                <Text style={styles.quickInfoLabel}>Location</Text>
                <Text style={styles.quickInfoValue}>At your place</Text>
              </View>
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text" size={20} color={COLORS.text.primary} />
              <Text style={styles.sectionTitle}>Description</Text>
            </View>
            <Text style={styles.description}>{service.description}</Text>
          </View>

          {/* Add-ons */}
          {activeAddons.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="add-circle" size={20} color="#10B981" />
                <Text style={styles.sectionTitle}>Available Add-ons</Text>
              </View>
              <View style={styles.addonsList}>
                {activeAddons.map((addon) => (
                  <View key={addon.id} style={styles.addonCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.addonName}>{addon.name}</Text>
                      {addon.description && (
                        <Text style={styles.addonDescription}>{addon.description}</Text>
                      )}
                    </View>
                    <View style={styles.addonPriceContainer}>
                      <Text style={styles.addonPriceLabel}>+QAR</Text>
                      <Text style={styles.addonPrice}>{Number(addon.price).toFixed(0)}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Provider */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="storefront" size={20} color={COLORS.text.primary} />
              <Text style={styles.sectionTitle}>Service Provider</Text>
            </View>

            {provider ? (
              <View style={styles.providerCard}>
                <View style={styles.providerHeader}>
                  {shopLogo ? (
                    <Image source={{ uri: shopLogo }} style={styles.providerAvatar} />
                  ) : (
                    <LinearGradient
                      colors={[COLORS.primary, COLORS.secondary]}
                      style={styles.providerAvatarPlaceholder}
                    >
                      <Text style={styles.providerAvatarText}>
                        {shopName.charAt(0).toUpperCase()}
                      </Text>
                    </LinearGradient>
                  )}

                  <View style={{ flex: 1 }}>
                    <Text style={styles.providerName}>{shopName}</Text>
                    {shopLocation && (
                      <View style={styles.providerLocation}>
                        <Ionicons name="location" size={12} color={COLORS.text.secondary} />
                        <Text style={styles.providerLocationText}>{shopLocation}</Text>
                      </View>
                    )}
                  </View>
                </View>

                {shopDesc && (
                  <Text style={styles.providerDescription}>{shopDesc}</Text>
                )}

                {(shopPhone || shopEmail) && (
                  <View style={styles.contactInfo}>
                    {shopPhone && (
                      <View style={styles.contactItem}>
                        <Ionicons name="call" size={14} color="#10B981" />
                        <Text style={styles.contactText}>{shopPhone}</Text>
                      </View>
                    )}
                    {shopEmail && (
                      <View style={styles.contactItem}>
                        <Ionicons name="mail" size={14} color="#10B981" />
                        <Text style={styles.contactText}>{shopEmail}</Text>
                      </View>
                    )}
                  </View>
                )}

                <TouchableOpacity
                  style={styles.viewProfileButton}
                  onPress={() => {
                    if (providerId) {
                      navigation.navigate('ProviderDetails', { providerId });
                    } else {
                      Alert.alert('Error', 'Provider information not available');
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.viewProfileText}>View Full Profile</Text>
                  <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={styles.providerUnavailable}>Provider information not available</Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Fixed Bottom CTA */}
 {/* Fixed Bottom CTA */}
<View style={styles.bottomSafe}>
  <View style={styles.bottomContainer}>
    <View style={styles.bottomPriceInfo}>
      <Text style={styles.bottomPriceLabel}>Total</Text>
      <Text style={styles.bottomPrice}>QAR {priceText}</Text>
    </View>
    
    <TouchableOpacity 
      style={styles.bookButton} 
      onPress={onBookPress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={[COLORS.primary, COLORS.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.bookButtonGradient}
      >
        <Text style={styles.bookButtonText}>Book Now</Text>
        <Ionicons name="arrow-forward" size={20} color="#FFF" />
      </LinearGradient>
    </TouchableOpacity>
  </View>
</View>

      {/* Auth Modal */}
      <AuthModal
        visible={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode="login"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },

  // Loading & Error
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
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  errorIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.danger,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  retryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 8,
  },
  retryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Header
  headerSafe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Platform.OS === 'ios' ? 180 : 140,
  },

  // Hero Gallery
  heroContainer: {
    height: HERO_HEIGHT,
    backgroundColor: '#F3F4F6',
  },
  gallery: {
    width: '100%',
    height: HERO_HEIGHT,
  },
  imageSlide: {
    width: SCREEN_WIDTH,
    height: HERO_HEIGHT,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  imageFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  noImageText: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  pagination: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  paginationDotActive: {
    width: 24,
    backgroundColor: '#FFFFFF',
  },

  // Content
  content: {
    padding: 20,
  },

  // Title Card
  titleCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text.primary,
    marginBottom: 12,
    lineHeight: 32,
  },
  priceContainer: {
    gap: 6,
  },
  priceLabel: {
    fontSize: 12,
    color: COLORS.text.secondary,
    fontWeight: '600',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  price: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.primary,
  },
  priceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  priceBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
  },

  // Quick Info
  quickInfoCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  quickInfoItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quickInfoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickInfoLabel: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginBottom: 2,
  },
  quickInfoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  quickInfoDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },

  // Section
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  description: {
    fontSize: 15,
    color: COLORS.text.secondary,
    lineHeight: 24,
  },

  // Addons
  addonsList: {
    gap: 12,
  },
  addonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  addonName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  addonDescription: {
    fontSize: 13,
    color: COLORS.text.secondary,
    lineHeight: 18,
  },
  addonPriceContainer: {
    alignItems: 'flex-end',
  },
  addonPriceLabel: {
    fontSize: 11,
    color: COLORS.text.secondary,
    marginBottom: 2,
  },
  addonPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
  },

  // Provider
  providerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  providerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  providerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  providerAvatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerAvatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  providerName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  providerLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  providerLocationText: {
    fontSize: 13,
    color: COLORS.text.secondary,
  },
  providerDescription: {
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  contactInfo: {
    gap: 8,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    marginBottom: 15,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactText: {
    fontSize: 13,
    color: COLORS.text.secondary,
  },
  viewProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  viewProfileText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  providerUnavailable: {
    fontSize: 14,
    color: COLORS.text.secondary,
    fontStyle: 'italic',
  },

  // Bottom CTA
// Bottom CTA
bottomSafe: {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  backgroundColor: '#FFFFFF',
  borderTopWidth: 1,
  borderTopColor: '#E5E7EB',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: -4 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 10,
},
bottomContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: 16,
  paddingTop: 16,
  paddingBottom: Platform.OS === 'ios' ? 100 : 100, // Accounts for tab bar + safe area
  gap: 16,
},
bottomPriceInfo: {
  flex: 1,
},
bottomPriceLabel: {
  fontSize: 12,
  color: COLORS.text.secondary,
  marginBottom: 2,
},
bottomPrice: {
  fontSize: 24,
  fontWeight: '800',
  color: COLORS.text.primary,
},
bookButton: {
  borderRadius: 16,
  overflow: 'hidden',
  shadowColor: COLORS.primary,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 8,
  elevation: 5,
},
bookButtonGradient: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: 32,
  paddingVertical: 16,
  gap: 8,
},
bookButtonText: {
  fontSize: 16,
  fontWeight: '700',
  color: '#FFFFFF',
},
});