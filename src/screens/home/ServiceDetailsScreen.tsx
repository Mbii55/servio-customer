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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS, SIZES } from '../../constants/colors';
import { ServiceAddon } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { AuthModal } from '../../components/auth/AuthModal';
import api from '../../services/api';
import { HomeStackParamList } from '../../navigation/types';

// ✅ NEW: Import React Query hooks
import { useService } from '../../hooks/useServices';
import { useToggleFavorite } from '../../hooks/useFavorites';
import { useQuery } from '@tanstack/react-query';

type Params = { serviceId: string };
type NavProp = NativeStackNavigationProp<HomeStackParamList>;

type ReviewItem = {
  id: string;
  booking_id: string;
  customer_id: string;
  provider_id: string;
  service_id: string;
  rating: number;
  comment: string | null;
  provider_response: string | null;
  provider_response_at: string | null;
  created_at: string;

  customer_first_name?: string;
  customer_last_name?: string;
  customer_profile_image?: string | null;
};

type ReviewStats = {
  total_reviews: number;
  average_rating: number;
  five_star_count: number;
  four_star_count: number;
  three_star_count: number;
  two_star_count: number;
  one_star_count: number;
  response_count: number;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_HEIGHT = 320;

export const ServiceDetailsScreen: React.FC = () => {
  const route = useRoute<RouteProp<Record<string, Params>, string>>();
  const navigation = useNavigation<NavProp>();
  const { serviceId } = route.params;

  const { isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // ✅ NEW: React Query hooks - replaces manual state management!
  const {
    data: service,
    isLoading: loading,
    error: queryError,
    refetch: refetchService
  } = useService(serviceId);

  // ✅ NEW: Load addons with React Query
  const {
    data: addons = []
  } = useQuery({
    queryKey: ['addons', 'service', serviceId],
    queryFn: async () => {
      try {
        const response = await api.get(`/addons/service/${serviceId}`);
        return (response.data || []) as ServiceAddon[];
      } catch (error) {
        console.error('Failed to load addons:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // ✅ NEW: Load reviews with React Query
  const {
    data: reviewsData,
    isLoading: reviewsLoading,
    error: reviewsQueryError,
    refetch: refetchReviews
  } = useQuery({
    queryKey: ['reviews', 'service', serviceId],
    queryFn: async () => {
      const res = await api.get(`/reviews/service/${serviceId}`);
      return {
        reviews: Array.isArray(res.data?.reviews) ? (res.data.reviews as ReviewItem[]) : [],
        statistics: (res.data?.statistics as ReviewStats | undefined) ?? null,
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes (reviews can be fresher)
  });

  const reviews = reviewsData?.reviews ?? [];
  const reviewStats = reviewsData?.statistics ?? null;
  const reviewsErr = reviewsQueryError ? 'Failed to load reviews' : null;

  // ✅ NEW: Optimistic favorite toggle
  const toggleFavoriteMutation = useToggleFavorite();

  // ✅ NEW: Get favorite status from favorites cache (if loaded)
  const { data: favoritesData } = useQuery({
    queryKey: ['favorites', 'status', serviceId],
    queryFn: async () => {
      if (!isAuthenticated) return { is_favorite: false };
      try {
        const res = await api.get(`/favorites/status/${serviceId}`);
        return res.data as { is_favorite: boolean };
      } catch {
        return { is_favorite: false };
      }
    },
    enabled: isAuthenticated,
    staleTime: 2 * 60 * 1000,
  });

  const isFavorite = favoritesData?.is_favorite ?? false;

  // Image gallery state
  const [activeIndex, setActiveIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<Record<number, boolean>>({});
  const galleryRef = useRef<ScrollView>(null);

  // Convert error to string
  const status = (queryError as any)?.response?.status;
  const apiMsg = (queryError as any)?.response?.data?.error;

  const err =
    status === 404
      ? 'This service is unavailable (it may have been deactivated).'
      : queryError
        ? (apiMsg || 'Failed to load service')
        : null;


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

  const activeAddons = useMemo(() => addons.filter((a) => a.is_active), [addons]);

  const isInactive = service?.is_active === false;

  const onBookPress = () => {
    if (isInactive) {
      Alert.alert("Service unavailable", "This service has been deactivated and can’t be booked.");
      return;
    }
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    navigation.navigate('BookService', { serviceId });
  };


  const onSharePress = async () => {
    try {
      await Share.share({
        message: `Check out ${service?.title} on Call To Clean!\n\nPrice: QAR ${priceText}`,
        title: service?.title,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  // ✅ IMPROVED: Optimistic favorite toggle (instant UI update)
  const onFavoritePress = async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    try {
      await toggleFavoriteMutation.mutateAsync(serviceId);
      // React Query handles optimistic update automatically!
    } catch (e: any) {
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

  const formatDate = (iso?: string | null) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString();
    } catch {
      return '';
    }
  };

  const initialsFrom = (first?: string, last?: string) => {
    const a = (first || '').trim().charAt(0).toUpperCase();
    const b = (last || '').trim().charAt(0).toUpperCase();
    return `${a}${b}`.trim() || 'U';
  };

  const renderStars = (rating: number, size = 14) => {
    const r = Math.max(0, Math.min(5, Math.round(rating)));
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Ionicons
            key={i}
            name={i <= r ? 'star' : 'star-outline'}
            size={size}
            color={i <= r ? '#F59E0B' : '#D1D5DB'}
            style={{ marginRight: 2 }}
          />
        ))}
      </View>
    );
  };

  if (loading && !service) {
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

        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => navigation.navigate('HomeScreen')}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.retryButtonGradient}
          >
            <Ionicons name="home-outline" size={18} color="#FFF" />
            <Text style={styles.retryButtonText}>Go Home</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Optional: Back button */}
        <TouchableOpacity
          style={[styles.retryButton, { marginTop: 10 }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#F3F4F6', '#E5E7EB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.retryButtonGradient}
          >
            <Ionicons name="arrow-back" size={18} color={COLORS.text.primary} />
            <Text style={[styles.retryButtonText, { color: COLORS.text.primary }]}>
              Back
            </Text>
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

  const avg = reviewStats?.average_rating ?? 0;
  const total = reviewStats?.total_reviews ?? 0;

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
            <TouchableOpacity
              style={styles.headerButton}
              onPress={onFavoritePress}
              disabled={toggleFavoriteMutation.isPending}
            >
              {toggleFavoriteMutation.isPending ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <Ionicons
                  name={isFavorite ? 'heart' : 'heart-outline'}
                  size={22}
                  color={isFavorite ? '#EF4444' : COLORS.text.primary}
                />
              )}
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
                        <LinearGradient colors={['#F9FAFB', '#F3F4F6']} style={styles.imageFallback}>
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
                    <TouchableOpacity key={idx} onPress={() => goToImage(idx)} activeOpacity={0.7}>
                      <View
                        style={[
                          styles.paginationDot,
                          idx === activeIndex && styles.paginationDotActive,
                        ]}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          ) : (
            <LinearGradient colors={['#F9FAFB', '#F3F4F6']} style={styles.imageFallback}>
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

              {isInactive && (
                <View style={{ padding: 12, borderRadius: 12, backgroundColor: '#FEF2F2', marginTop: 12 }}>
                  <Text style={{ color: '#B91C1C', fontWeight: '600' }}>
                    This service is currently unavailable.
                  </Text>
                </View>
              )}

              {/* Rating summary */}
              <View style={styles.ratingSummaryRow}>
                {renderStars(avg, 16)}
                <Text style={styles.ratingSummaryText}>
                  {avg ? `${avg.toFixed(1)} / 5` : 'No rating yet'} • {total} review{total === 1 ? '' : 's'}
                </Text>
              </View>

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
                      <Text style={styles.providerAvatarText}>{shopName.charAt(0).toUpperCase()}</Text>
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

                {shopDesc && <Text style={styles.providerDescription}>{shopDesc}</Text>}

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
                    if (providerId) navigation.navigate('ProviderDetails', { providerId });
                    else Alert.alert('Error', 'Provider information not available');
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

          {/* Reviews Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="star" size={20} color={COLORS.text.primary} />
              <Text style={styles.sectionTitle}>Ratings & Reviews</Text>

              <View style={{ flex: 1 }} />

              <TouchableOpacity
                onPress={() => refetchReviews()}
                activeOpacity={0.7}
                style={styles.refreshMini}
              >
                <Ionicons name="refresh" size={18} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            {/* Summary card */}
            <View style={styles.reviewSummaryCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={styles.reviewSummaryLeft}>
                  <Text style={styles.reviewAvgText}>{avg ? avg.toFixed(1) : '0.0'}</Text>
                  {renderStars(avg, 16)}
                  <Text style={styles.reviewCountText}>{total} review{total === 1 ? '' : 's'}</Text>
                </View>

                <View style={styles.reviewSummaryRight}>
                  {reviewStats ? (
                    <>
                      <View style={styles.barRow}>
                        <Text style={styles.barLabel}>5</Text>
                        <View style={styles.barTrack}>
                          <View
                            style={[
                              styles.barFill,
                              {
                                width:
                                  total > 0
                                    ? `${(reviewStats.five_star_count / total) * 100}%`
                                    : '0%',
                              },
                            ]}
                          />
                        </View>
                        <Text style={styles.barCount}>{reviewStats.five_star_count}</Text>
                      </View>
                      <View style={styles.barRow}>
                        <Text style={styles.barLabel}>4</Text>
                        <View style={styles.barTrack}>
                          <View
                            style={[
                              styles.barFill,
                              {
                                width:
                                  total > 0
                                    ? `${(reviewStats.four_star_count / total) * 100}%`
                                    : '0%',
                              },
                            ]}
                          />
                        </View>
                        <Text style={styles.barCount}>{reviewStats.four_star_count}</Text>
                      </View>
                      <View style={styles.barRow}>
                        <Text style={styles.barLabel}>3</Text>
                        <View style={styles.barTrack}>
                          <View
                            style={[
                              styles.barFill,
                              {
                                width:
                                  total > 0
                                    ? `${(reviewStats.three_star_count / total) * 100}%`
                                    : '0%',
                              },
                            ]}
                          />
                        </View>
                        <Text style={styles.barCount}>{reviewStats.three_star_count}</Text>
                      </View>
                      <View style={styles.barRow}>
                        <Text style={styles.barLabel}>2</Text>
                        <View style={styles.barTrack}>
                          <View
                            style={[
                              styles.barFill,
                              {
                                width:
                                  total > 0
                                    ? `${(reviewStats.two_star_count / total) * 100}%`
                                    : '0%',
                              },
                            ]}
                          />
                        </View>
                        <Text style={styles.barCount}>{reviewStats.two_star_count}</Text>
                      </View>
                      <View style={styles.barRow}>
                        <Text style={styles.barLabel}>1</Text>
                        <View style={styles.barTrack}>
                          <View
                            style={[
                              styles.barFill,
                              {
                                width:
                                  total > 0
                                    ? `${(reviewStats.one_star_count / total) * 100}%`
                                    : '0%',
                              },
                            ]}
                          />
                        </View>
                        <Text style={styles.barCount}>{reviewStats.one_star_count}</Text>
                      </View>
                    </>
                  ) : (
                    <Text style={styles.reviewSummaryPlaceholder}>No stats</Text>
                  )}
                </View>
              </View>
            </View>

            {reviewsLoading ? (
              <View style={styles.reviewsLoading}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.reviewsLoadingText}>Loading reviews...</Text>
              </View>
            ) : reviewsErr ? (
              <View style={styles.reviewsErrorBox}>
                <Ionicons name="alert-circle" size={18} color={COLORS.danger} />
                <Text style={styles.reviewsErrorText}>{reviewsErr}</Text>
              </View>
            ) : reviews.length === 0 ? (
              <View style={styles.emptyReviews}>
                <Ionicons name="chatbubble-ellipses-outline" size={24} color={COLORS.text.light} />
                <Text style={styles.emptyReviewsText}>No reviews yet</Text>
              </View>
            ) : (
              <View style={{ gap: 12 }}>
                {reviews.map((r) => {
                  const first = r.customer_first_name || 'User';
                  const last = r.customer_last_name || '';
                  const name = `${first} ${last}`.trim();
                  const avatar = r.customer_profile_image || null;

                  return (
                    <View key={r.id} style={styles.reviewCard}>
                      <View style={styles.reviewHeader}>
                        {avatar ? (
                          <Image source={{ uri: avatar }} style={styles.reviewAvatar} />
                        ) : (
                          <LinearGradient
                            colors={[COLORS.primary, COLORS.secondary]}
                            style={styles.reviewAvatarFallback}
                          >
                            <Text style={styles.reviewAvatarText}>{initialsFrom(first, last)}</Text>
                          </LinearGradient>
                        )}

                        <View style={{ flex: 1 }}>
                          <Text style={styles.reviewerName}>{name}</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            {renderStars(r.rating, 14)}
                            <Text style={styles.reviewDate}>{formatDate(r.created_at)}</Text>
                          </View>
                        </View>
                      </View>

                      {!!r.comment && <Text style={styles.reviewComment}>{r.comment}</Text>}

                      {/* Provider Response */}
                      {r.provider_response ? (
                        <View style={styles.providerResponseBox}>
                          <View style={styles.providerResponseHeader}>
                            <Ionicons name="storefront" size={14} color={COLORS.primary} />
                            <Text style={styles.providerResponseTitle}>Provider Response</Text>
                            <View style={{ flex: 1 }} />
                            {!!r.provider_response_at && (
                              <Text style={styles.providerResponseDate}>
                                {formatDate(r.provider_response_at)}
                              </Text>
                            )}
                          </View>
                          <Text style={styles.providerResponseText}>{r.provider_response}</Text>
                        </View>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Fixed Bottom CTA */}
      <SafeAreaView style={styles.bottomSafe} edges={['bottom']}>
        <View style={styles.bottomContainer}>
          <View style={styles.bottomPriceInfo}>
            <Text style={styles.bottomPriceLabel}>Total</Text>
            <Text style={styles.bottomPrice}>QAR {priceText}</Text>
          </View>

          <TouchableOpacity style={[styles.bookButton, isInactive && { opacity: 0.5 }]}
            onPress={onBookPress}
            activeOpacity={0.8}
            disabled={isInactive}>
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
      </SafeAreaView>

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
  container: { flex: 1, backgroundColor: COLORS.background.primary },
  headerSafe: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20 },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  headerActions: { flexDirection: 'row', gap: 10 },

  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 280 }, // Increased to prevent overlap

  heroContainer: { height: HERO_HEIGHT, backgroundColor: '#fff' },
  gallery: { height: HERO_HEIGHT },
  imageSlide: { width: SCREEN_WIDTH, height: HERO_HEIGHT },
  heroImage: { width: '100%', height: '100%' },
  imageFallback: {
    width: '100%',
    height: HERO_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  noImageText: { color: COLORS.text.secondary, fontSize: 14 },

  pagination: {
    position: 'absolute',
    bottom: 14,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  paginationDotActive: { width: 18, backgroundColor: 'rgba(255,255,255,0.95)' },

  content: { paddingHorizontal: 16, paddingTop: 14, gap: 14 },

  titleCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.text.primary, marginBottom: 6 },

  ratingSummaryRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  ratingSummaryText: { color: COLORS.text.secondary, fontSize: 13, fontWeight: '600' },

  priceContainer: { gap: 4 },
  priceLabel: { color: COLORS.text.secondary, fontSize: 13, fontWeight: '600' },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  price: { fontSize: 22, fontWeight: '900', color: COLORS.text.primary },
  priceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  priceBadgeText: { color: '#10B981', fontWeight: '800', fontSize: 12 },

  quickInfoCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  quickInfoItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  quickInfoIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickInfoLabel: { color: COLORS.text.secondary, fontSize: 12, fontWeight: '700' },
  quickInfoValue: { color: COLORS.text.primary, fontSize: 14, fontWeight: '800', marginTop: 2 },
  quickInfoDivider: { width: 1, height: 42, backgroundColor: '#E5E7EB', marginHorizontal: 10 },

  section: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '900', color: COLORS.text.primary },
  description: { color: COLORS.text.secondary, fontSize: 14, lineHeight: 20 },

  addonsList: { gap: 10 },
  addonCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addonName: { fontSize: 14, fontWeight: '900', color: COLORS.text.primary },
  addonDescription: { fontSize: 13, color: COLORS.text.secondary, marginTop: 4 },
  addonPriceContainer: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  addonPriceLabel: { color: COLORS.text.secondary, fontWeight: '800', fontSize: 12 },
  addonPrice: { color: COLORS.text.primary, fontWeight: '900', fontSize: 16 },

  providerCard: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 18, padding: 14, gap: 10 },
  providerHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  providerAvatar: { width: 54, height: 54, borderRadius: 16, backgroundColor: '#F3F4F6' },
  providerAvatarPlaceholder: {
    width: 54,
    height: 54,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  providerAvatarText: { color: '#fff', fontWeight: '900', fontSize: 18 },
  providerName: { fontSize: 15, fontWeight: '900', color: COLORS.text.primary },
  providerLocation: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  providerLocationText: { color: COLORS.text.secondary, fontSize: 12, fontWeight: '600' },
  providerDescription: { color: COLORS.text.secondary, fontSize: 13, lineHeight: 19 },
  contactInfo: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  contactItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  contactText: { color: COLORS.text.secondary, fontSize: 13, fontWeight: '600' },
  viewProfileButton: {
    marginTop: 6,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  viewProfileText: { color: COLORS.primary, fontWeight: '900', fontSize: 14 },
  providerUnavailable: { color: COLORS.text.secondary, fontSize: 13 },

  // Reviews
  refreshMini: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewSummaryCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 18,
    padding: 14,
    backgroundColor: '#FFFFFF',
  },
  reviewSummaryLeft: { width: 120, alignItems: 'flex-start', gap: 6 },
  reviewAvgText: { fontSize: 28, fontWeight: '900', color: COLORS.text.primary },
  reviewCountText: { color: COLORS.text.secondary, fontSize: 12, fontWeight: '700' },
  reviewSummaryRight: { flex: 1, gap: 8 },
  reviewSummaryPlaceholder: { color: COLORS.text.secondary, fontWeight: '700' },

  barRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  barLabel: { width: 12, color: COLORS.text.secondary, fontWeight: '800' },
  barTrack: {
    flex: 1,
    height: 8,
    borderRadius: 99,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  barFill: { height: '100%', backgroundColor: '#F59E0B' },
  barCount: { width: 26, textAlign: 'right', color: COLORS.text.secondary, fontWeight: '800' },

  reviewsLoading: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 6 },
  reviewsLoadingText: { color: COLORS.text.secondary, fontWeight: '700' },
  reviewsErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 14,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  reviewsErrorText: { color: COLORS.danger, fontWeight: '800', flex: 1 },

  emptyReviews: { alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 8 },
  emptyReviewsText: { color: COLORS.text.secondary, fontWeight: '800' },

  reviewCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 18,
    padding: 14,
    backgroundColor: '#fff',
    gap: 10,
  },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  reviewAvatar: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#F3F4F6' },
  reviewAvatarFallback: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  reviewAvatarText: { color: '#fff', fontWeight: '900' },
  reviewerName: { color: COLORS.text.primary, fontWeight: '900', fontSize: 14 },
  reviewDate: { color: COLORS.text.secondary, fontSize: 12, fontWeight: '700' },
  reviewComment: { color: COLORS.text.secondary, fontSize: 13, lineHeight: 19 },

  providerResponseBox: {
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  providerResponseHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  providerResponseTitle: { color: COLORS.primary, fontWeight: '900', fontSize: 13 },
  providerResponseDate: { color: COLORS.text.secondary, fontWeight: '700', fontSize: 12 },
  providerResponseText: { color: COLORS.text.secondary, fontSize: 13, lineHeight: 19 },

  // Fixed bottom CTA - now always visible
  bottomSafe: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 70,
    zIndex: 30,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  bottomContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bottomPriceInfo: { flex: 1 },
  bottomPriceLabel: { color: COLORS.text.secondary, fontWeight: '700', fontSize: 12 },
  bottomPrice: { color: COLORS.text.primary, fontWeight: '900', fontSize: 18, marginTop: 2 },

  bookButton: { width: 160, borderRadius: 16, overflow: 'hidden' },
  bookButtonGradient: { paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  bookButtonText: { color: '#fff', fontWeight: '900', fontSize: 14 },

  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loadingText: { color: COLORS.text.secondary, fontWeight: '700' },

  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, gap: 14 },
  errorIconContainer: { width: 80, height: 80, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  errorTitle: { textAlign: 'center', color: COLORS.text.primary, fontWeight: '900', fontSize: 16 },
  retryButton: { width: '70%', borderRadius: 16, overflow: 'hidden' },
  retryButtonGradient: { paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  retryButtonText: { color: '#fff', fontWeight: '900' },
});