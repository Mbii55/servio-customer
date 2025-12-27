// src/components/favorites/FavoriteCard.tsx
import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES } from '../../constants/colors';

export type FavoriteServiceItem = {
  id: string;
  title: string;
  description?: string | null;
  base_price: string | number;
  duration_minutes?: number | null;
  images?: any;

  business_name?: string | null;
  provider_first_name?: string | null;
  provider_last_name?: string | null;

  category_name?: string | null;

  favorite_id?: string;
  favorited_at?: string;
};

type Props = {
  item: FavoriteServiceItem;
  onPress: (serviceId: string) => void;
  onRemove: (serviceId: string) => void;
};

export const FavoriteCard: React.FC<Props> = ({ item, onPress, onRemove }) => {
  const [imgFailed, setImgFailed] = useState(false);

  const imageUrl = useMemo(() => {
    const raw = Array.isArray(item.images) ? item.images?.[0] : item.images?.[0];
    return typeof raw === 'string' && raw.trim().length ? raw : null;
  }, [item.images]);

  const providerLabel =
    item.business_name ||
    `${item.provider_first_name ?? ''} ${item.provider_last_name ?? ''}`.trim() ||
    'Provider';

  const durationLabel = item.duration_minutes ? `${item.duration_minutes} min` : 'Flexible';
  const priceLabel = useMemo(() => {
    const n = Number(item.base_price);
    return Number.isFinite(n) ? `${n.toFixed(0)}` : `${item.base_price}`;
  }, [item.base_price]);

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => onPress(item.id)} 
      activeOpacity={0.85}
    >
      {/* Image Container */}
      <View style={styles.imageContainer}>
        {imageUrl && !imgFailed ? (
          <>
            <Image
              source={{ uri: imageUrl }}
              style={styles.image}
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
            <Text style={styles.priceText}>QAR {priceLabel}</Text>
          </LinearGradient>
        </View>

        {/* Favorite Button */}
        <TouchableOpacity
          onPress={() => onRemove(item.id)}
          style={styles.favoriteButton}
          activeOpacity={0.8}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <View style={styles.favoriteButtonInner}>
            <Ionicons name="heart" size={22} color="#EF4444" />
          </View>
        </TouchableOpacity>

        {/* Category Badge */}
        {item.category_name && (
          <View style={styles.categoryBadge}>
            <View style={styles.categoryBadgeContent}>
              <Ionicons name="pricetag" size={10} color={COLORS.primary} />
              <Text style={styles.categoryText}>{item.category_name}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>

        {/* Provider Info */}
        <View style={styles.providerContainer}>
          <View style={styles.providerBadge}>
            <Ionicons name="storefront" size={10} color={COLORS.primary} />
          </View>
          <Text style={styles.providerName} numberOfLines={1}>
            {providerLabel}
          </Text>
        </View>

        {/* Description */}
        {item.description && (
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        {/* Meta Info */}
        <View style={styles.metaContainer}>
          <View style={styles.metaBadge}>
            <Ionicons name="time" size={12} color={COLORS.primary} />
            <Text style={styles.metaBadgeText}>{durationLabel}</Text>
          </View>

          <View style={styles.savedBadge}>
            <Ionicons name="heart" size={11} color="#EF4444" />
            <Text style={styles.savedBadgeText}>Saved</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
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

  // Image
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 180,
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
    height: 70,
  },
  imageFallback: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Price Badge
  priceBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
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
  },
  priceText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Favorite Button
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    borderRadius: 24,
    overflow: 'hidden',
  },
  favoriteButtonInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },

  // Category Badge
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
  categoryText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
  },

  // Content
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

  // Provider
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

  // Description
  description: {
    fontSize: 13,
    color: COLORS.text.secondary,
    lineHeight: 19,
    marginBottom: 12,
  },

  // Meta
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  metaBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  savedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  savedBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },
});