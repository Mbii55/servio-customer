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
    if (Number.isFinite(n)) return `QAR ${n.toFixed(2)}`;
    return `QAR ${service.base_price}`;
  }, [service.base_price]);

  const providerName = useMemo(() => {
    if (!showProviderInfo) return '';

    const s: any = service as any;
    const bp = s?.provider?.business_profile;

    // Priority 1: business_name from business_profile
    if (bp?.business_name) {
      return bp.business_name;
    }

    // Priority 2: Combine first_name and last_name
    const fn = s?.provider?.first_name ?? '';
    const ln = s?.provider?.last_name ?? '';
    const full = `${fn} ${ln}`.trim();
    return full || 'Service Provider';
  }, [service, showProviderInfo]);

  const durationText = service.duration_minutes ? `${service.duration_minutes} min` : 'Flexible';

  return (
    <TouchableOpacity style={[styles.card, style]} onPress={onPress} activeOpacity={0.88}>
      {/* Image + overlays */}
      <View style={styles.imageWrap}>
        {primaryImage && !imgFailed ? (
          <Image
            source={{ uri: primaryImage }}
            style={styles.image as ImageStyle}
            resizeMode="cover"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <View style={styles.imageFallback}>
            <Ionicons name="image-outline" size={30} color={COLORS.text.light} />
            <Text style={styles.fallbackText}>No image</Text>
          </View>
        )}

        {/* Price pill */}
        <View style={styles.pricePill}>
          <Ionicons name="cash-outline" size={14} color="#fff" />
          <Text style={styles.pricePillText} numberOfLines={1}>
            {priceText}
          </Text>
        </View>

        {/* Duration pill */}
        {service.duration_minutes && (
          <View style={styles.durationPill}>
            <Ionicons name="time-outline" size={14} color={COLORS.text.primary} />
            <Text style={styles.durationPillText} numberOfLines={1}>
              {durationText}
            </Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.body}>
        {/* Title and Category */}
        <View style={styles.titleRow}>
          <Text numberOfLines={1} style={styles.title}>
            {service.title}
          </Text>
          {showCategory && categoryName && (
            <View style={styles.categoryPill}>
              <Ionicons name="pricetag-outline" size={10} color={COLORS.text.secondary} />
              <Text style={styles.categoryText} numberOfLines={1}>
                {categoryName}
              </Text>
            </View>
          )}
        </View>

        {/* Provider Info - Business Name */}
        {showProviderInfo && providerName && (
          <View style={styles.providerRow}>
            <Ionicons name="storefront-outline" size={14} color={COLORS.text.secondary} />
            <Text numberOfLines={1} style={styles.providerText}>
              {providerName}
            </Text>
          </View>
        )}

        {/* Description */}
        <Text numberOfLines={2} style={styles.desc}>
          {service.description || 'No description provided.'}
        </Text>

        {/* Bottom meta row - Only Location */}
        {showLocation && (
          <View style={styles.bottomRow}>
            <View style={styles.metaChipSecondary}>
              <Ionicons name="location-outline" size={14} color={COLORS.text.secondary} />
              <Text style={styles.metaChipSecondaryText} numberOfLines={1}>
                Nearby
              </Text>
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: SIZES.radius,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  imageWrap: {
    position: 'relative',
    width: '100%',
    height: 180,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  fallbackText: {
    fontSize: SIZES.small,
    color: COLORS.text.light,
  },
  pricePill: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  pricePillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  durationPill: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 4,
  },
  durationPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  body: {
    padding: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  title: {
    flex: 1,
    fontSize: SIZES.h4,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginRight: 8,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.tertiary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.text.secondary,
    textTransform: 'uppercase',
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  providerText: {
    fontSize: SIZES.small,
    color: COLORS.text.secondary,
    fontWeight: '600',
    flex: 1,
  },
  desc: {
    fontSize: SIZES.small,
    color: COLORS.text.secondary,
    lineHeight: 20,
    marginBottom: 10,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaChipSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaChipSecondaryText: {
    fontSize: SIZES.small,
    color: COLORS.text.secondary,
    fontWeight: '500',
  },
});