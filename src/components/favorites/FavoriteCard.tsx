// src/components/favorites/FavoriteCard.tsx
import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
    return Number.isFinite(n) ? `QAR ${n.toFixed(2)}` : `QAR ${item.base_price}`;
  }, [item.base_price]);

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(item.id)} activeOpacity={0.9}>
      {/* Thumbnail */}
      <View style={styles.thumbWrap}>
        {imageUrl && !imgFailed ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.thumb}
            onError={() => setImgFailed(true)}
          />
        ) : (
          <View style={[styles.thumb, styles.thumbFallback]}>
            <Ionicons name="image-outline" size={22} color={COLORS.text.secondary} />
          </View>
        )}

        {/* Bottom fade (premium feel) */}
        <View pointerEvents="none" style={styles.thumbFade} />

        {/* Price pill */}
        <View style={styles.pricePill}>
          <Text style={styles.pricePillText} numberOfLines={1}>
            {priceLabel}
          </Text>
        </View>

        {/* Remove */}
        <TouchableOpacity
          onPress={() => onRemove(item.id)}
          style={styles.removeBtn}
          activeOpacity={0.85}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="heart" size={24} color={COLORS.danger} />
        </TouchableOpacity>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>

        <View style={styles.subRow}>
          <Ionicons name="storefront-outline" size={14} color={COLORS.text.secondary} />
          <Text style={styles.sub} numberOfLines={1}>
            {providerLabel}
            {item.category_name ? ` • ${item.category_name}` : ''}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaChip}>
            <Ionicons name="time-outline" size={14} color={COLORS.primary} />
            <Text style={styles.metaChipText}>{durationLabel}</Text>
          </View>

          <View style={styles.metaChipSoft}>
            <Ionicons name="shield-checkmark" size={14} color={COLORS.text.secondary} />
            <Text style={styles.metaChipSoftText}>Saved</Text>
          </View>
        </View>

        {!!item.description && (
          <Text style={styles.desc} numberOfLines={2}>
            {item.description}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const R = 20;

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.background.primary,
    borderRadius: R,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: (COLORS as any).borderSoft ?? COLORS.border,

    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,

    marginBottom: 14,
  },

  thumbWrap: {
    height: 150,
    backgroundColor: COLORS.background.tertiary,
    position: 'relative',
  },
  thumb: { width: '100%', height: '100%' },
  thumbFallback: { alignItems: 'center', justifyContent: 'center' },

  thumbFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 70,
    backgroundColor: 'rgba(0,0,0,0.20)',
  },

  pricePill: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  pricePillText: {
    fontSize: 12.5,
    fontWeight: '900',
    color: COLORS.text.primary,
  },

removeBtn: {
  position: 'absolute',
  top: 12,
  right: 12,
  width: 46,
  height: 46,
  borderRadius: 23, // perfect circle
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#FFFFFF',

  // subtle elevation
  shadowColor: '#000',
  shadowOpacity: 0.12,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 4 },
  elevation: 5,

  borderWidth: 1,
  borderColor: 'rgba(0,0,0,0.06)',
},



  info: { padding: 12, paddingTop: 10 },

  title: { fontSize: 15.5, fontWeight: '900', color: COLORS.text.primary },

  subRow: { marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 6 },
  sub: { fontSize: 12.5, fontWeight: '700', color: COLORS.text.secondary, flex: 1 },

  metaRow: { marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },

  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: (COLORS as any).primarySoft ?? COLORS.background.secondary,
    borderWidth: 1,
    borderColor: (COLORS as any).borderSoft ?? COLORS.border,
  },
  metaChipText: { fontSize: 12, fontWeight: '900', color: COLORS.primary },

  metaChipSoft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: COLORS.background.secondary,
    borderWidth: 1,
    borderColor: (COLORS as any).borderSoft ?? COLORS.border,
  },
  metaChipSoftText: { fontSize: 12, fontWeight: '800', color: COLORS.text.secondary },

  desc: {
    marginTop: 10,
    fontSize: 12.5,
    color: COLORS.text.secondary,
    lineHeight: 18,
  },
});
