// src/components/services/ServiceCard.tsx
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ViewStyle,
  ImageStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES } from '../../constants/colors';
import { Service } from '../../types';

type Props = {
  service: Service;
  onPress: () => void;
  style?: ViewStyle;
  showProviderInfo?: boolean;
  showCategory?: boolean;
  categoryName?: string;
  showLocation?: boolean;
};

// ============================================
// MAIN SERVICE CARD (Full Width)
// ============================================
export const ServiceCard: React.FC<Props> = ({
  service,
  onPress,
  style,
  showProviderInfo = true,
  showCategory = false,
  categoryName,
  showLocation = true,
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  const primaryImage = useMemo(() => {
    const first = service.images?.[0];
    return typeof first === 'string' && first.trim().length > 0 ? first : null;
  }, [service.images]);

  const priceText = useMemo(() => {
    const n = Number(service.base_price);
    if (Number.isFinite(n)) return `${n.toFixed(0)}`;
    return `${service.base_price}`;
  }, [service.base_price]);

  const providerName = useMemo(() => {
    if (!showProviderInfo) return '';

    const s: any = service as any;
    const bp = s?.provider?.business_profile;

    if (bp?.business_name) {
      return bp.business_name;
    }

    const fn = s?.provider?.first_name ?? '';
    const ln = s?.provider?.last_name ?? '';
    const full = `${fn} ${ln}`.trim();
    return full || 'Service Provider';
  }, [service, showProviderInfo]);

  const durationText = service.duration_minutes ? `${service.duration_minutes} min` : 'Flexible';

  return (
    <TouchableOpacity 
      style={[styles.card, style]} 
      onPress={onPress} 
      activeOpacity={0.85}
    >
      {/* Image Container */}
      <View style={styles.imageContainer}>
        {primaryImage && !imgFailed ? (
          <>
            <Image
              source={{ uri: primaryImage }}
              style={styles.image as ImageStyle}
              resizeMode="cover"
              onError={() => setImgFailed(true)}
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.7)']}
              style={styles.imageGradient}
            />
          </>
        ) : (
          <LinearGradient
            colors={['#EFF6FF', '#DBEAFE']}
            style={styles.imageFallback}
          >
            <Ionicons name="image-outline" size={36} color={COLORS.primary} />
          </LinearGradient>
        )}

        {/* Price Badge */}
        <View style={styles.priceBadge}>
          <LinearGradient
            colors={[COLORS.primary, COLORS.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.priceGradient}
          >
            <Text style={styles.priceAmount}>QAR {priceText}</Text>
          </LinearGradient>
        </View>

        {/* Category Badge */}
        {showCategory && categoryName && (
          <View style={styles.categoryBadge}>
            <View style={styles.categoryBadgeContent}>
              <Ionicons name="pricetag" size={10} color={COLORS.primary} />
              <Text style={styles.categoryBadgeText} numberOfLines={1}>
                {categoryName}
              </Text>
            </View>
          </View>
        )}

        {/* Duration Badge */}
        {service.duration_minutes && (
          <View style={styles.durationBadge}>
            <View style={styles.durationBadgeContent}>
              <Ionicons name="time" size={12} color={COLORS.text.secondary} />
              <Text style={styles.durationText}>{durationText}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Title */}
        <Text numberOfLines={2} style={styles.title}>
          {service.title}
        </Text>

        {/* Provider Info */}
        {showProviderInfo && providerName && (
          <View style={styles.providerContainer}>
            <View style={styles.providerBadge}>
              <Ionicons name="storefront" size={10} color={COLORS.primary} />
            </View>
            <Text numberOfLines={1} style={styles.providerName}>
              {providerName}
            </Text>
          </View>
        )}

        {/* Description */}
        {service.description && (
          <Text numberOfLines={2} style={styles.description}>
            {service.description}
          </Text>
        )}

        {/* Footer Meta */}
        <View style={styles.footer}>
          {showLocation && (
            <View style={styles.metaItem}>
              <Ionicons name="location" size={12} color={COLORS.text.secondary} />
              <Text style={styles.metaText}>Nearby</Text>
            </View>
          )}
          
          <View style={styles.metaItem}>
            <View style={styles.ratingDot} />
            <Text style={styles.metaText}>Popular</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ============================================
// COMPACT SERVICE CARD (For Horizontal Lists)
// ============================================
export const ServiceCardCompact: React.FC<Props> = ({
  service,
  onPress,
  style,
  showProviderInfo = false,
  showCategory = false,
  categoryName,
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  const primaryImage = useMemo(() => {
    const first = service.images?.[0];
    return typeof first === 'string' && first.trim().length > 0 ? first : null;
  }, [service.images]);

  const priceText = useMemo(() => {
    const n = Number(service.base_price);
    if (Number.isFinite(n)) return `${n.toFixed(0)}`;
    return `${service.base_price}`;
  }, [service.base_price]);

  const durationText = service.duration_minutes ? `${service.duration_minutes} min` : null;

  return (
    <TouchableOpacity 
      style={[styles.compactCard, style]} 
      onPress={onPress} 
      activeOpacity={0.85}
    >
      {/* Image */}
      <View style={styles.compactImageContainer}>
        {primaryImage && !imgFailed ? (
          <>
            <Image
              source={{ uri: primaryImage }}
              style={styles.compactImage as ImageStyle}
              resizeMode="cover"
              onError={() => setImgFailed(true)}
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.6)']}
              style={styles.compactGradient}
            />
          </>
        ) : (
          <LinearGradient
            colors={['#EFF6FF', '#DBEAFE']}
            style={styles.compactImageFallback}
          >
            <Ionicons name="image-outline" size={32} color={COLORS.primary} />
          </LinearGradient>
        )}

        {/* Price Badge */}
        <View style={styles.compactPriceBadge}>
          <Text style={styles.compactPriceText}>QAR {priceText}</Text>
        </View>

        {/* Duration if available */}
        {durationText && (
          <View style={styles.compactDurationBadge}>
            <Ionicons name="time" size={10} color={COLORS.text.secondary} />
            <Text style={styles.compactDurationText}>{durationText}</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.compactContent}>
        <Text numberOfLines={2} style={styles.compactTitle}>
          {service.title}
        </Text>

        {showCategory && categoryName && (
          <View style={styles.compactCategoryBadge}>
            <Text style={styles.compactCategoryText} numberOfLines={1}>
              {categoryName}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
  // Main Card Styles
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
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
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 160,
    backgroundColor: '#F9FAFB',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  imageFallback: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  priceBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  priceGradient: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  categoryBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  categoryBadgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  durationBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  durationBadgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    gap: 4,
  },
  durationText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 8,
    lineHeight: 22,
  },
  providerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  providerBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },
  description: {
    fontSize: 13,
    color: COLORS.text.secondary,
    lineHeight: 19,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.text.secondary,
  },
  ratingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },

  // Compact Card Styles
  compactCard: {
    width: 220,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  compactImageContainer: {
    position: 'relative',
    width: '100%',
    height: 140,
  },
  compactImage: {
    width: '100%',
    height: '100%',
  },
  compactImageFallback: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 50,
  },
  compactPriceBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  compactPriceText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
  },
  compactDurationBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  compactDurationText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  compactContent: {
    padding: 14,
  },
  compactTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 6,
    lineHeight: 20,
  },
  compactCategoryBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  compactCategoryText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
  },

  // ⭐ Rating badge (top-right on image)
ratingBadge: {
  position: 'absolute',
  top: 12,
  right: 12,
  borderRadius: 12,
  backgroundColor: 'rgba(17, 24, 39, 0.75)', // dark overlay
  overflow: 'hidden',
},

ratingBadgeContent: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: 8,
  paddingVertical: 5,
  gap: 4,
},

ratingBadgeText: {
  fontSize: 12,
  fontWeight: '800',
  color: '#FFFFFF',
},

ratingBadgeCount: {
  fontSize: 11,
  fontWeight: '600',
  color: 'rgba(255,255,255,0.85)',
},

// ⭐ Compact rating badge
compactRatingBadge: {
  position: 'absolute',
  top: 10,
  right: 10,
  backgroundColor: 'rgba(17, 24, 39, 0.75)',
  paddingHorizontal: 8,
  paddingVertical: 5,
  borderRadius: 10,
},

compactRatingBadgeContent: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 4,
},

compactRatingText: {
  fontSize: 11,
  fontWeight: '800',
  color: '#FFFFFF',
},

});