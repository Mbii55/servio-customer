// src/screens/home/ProviderDetailsScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert,
  SafeAreaView,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES } from '../../constants/colors';
import { HomeStackParamList } from '../../navigation/types';
import { useAuth } from '../../context/AuthContext';

// ✅ NEW: Import React Query hooks
import { useProvider } from '../../hooks/useProviders';
import { useToggleProviderFavorite } from '../../hooks/useFavorites';
import { usePrefetchService } from '../../hooks/useServices';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';

const { width } = Dimensions.get('window');

interface Service {
  id: string;
  title: string;
  description: string;
  base_price: number;
  duration_minutes: number | null;
  images: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Business {
  id: string;
  business_name: string;
  business_description: string | null;
  business_logo: string | null;
  business_email: string | null;
  business_phone: string | null;
  street_address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface Provider {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  profile_image: string | null;
  role: string;
  status: string;
  created_at: string;
  business: Business | null;
  services: Service[];
}

type ProviderDetailsScreenRouteProp = RouteProp<HomeStackParamList, 'ProviderDetails'>;
type ProviderDetailsScreenNavigationProp = NativeStackNavigationProp<HomeStackParamList>;

export const ProviderDetailsScreen: React.FC = () => {
  const navigation = useNavigation<ProviderDetailsScreenNavigationProp>();
  const route = useRoute<ProviderDetailsScreenRouteProp>();
  const { providerId } = route.params;
  const { isAuthenticated } = useAuth();

  // ✅ NEW: React Query hooks - replaces manual state management!
  const { 
    data: provider, 
    isLoading: loading,
    error: queryError 
  } = useQuery({
    queryKey: ['provider', providerId],
    queryFn: async () => {
      const response = await api.get(`/users/providers/${providerId}`);
      return response.data.provider as Provider;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // ✅ NEW: Get favorite status with React Query
  const { data: favoriteData } = useQuery({
    queryKey: ['favorites', 'provider', providerId],
    queryFn: async () => {
      if (!isAuthenticated) return { is_favorite: false };
      try {
        const res = await api.get(`/favorites/provider/status/${providerId}`);
        return res.data as { is_favorite: boolean };
      } catch {
        return { is_favorite: false };
      }
    },
    enabled: isAuthenticated && !!provider,
    staleTime: 2 * 60 * 1000,
  });

  const isProviderFavorite = favoriteData?.is_favorite ?? false;

  // ✅ NEW: Optimistic favorite toggle
  const toggleFavoriteMutation = useToggleProviderFavorite();

  // ✅ NEW: Prefetch service before navigation
  const prefetchService = usePrefetchService();

  // Handle error
  if (queryError && !loading) {
    Alert.alert(
      'Error',
      'Failed to load provider details',
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  }

  // ✅ IMPROVED: Optimistic favorite toggle (instant UI update)
  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      Alert.alert('Login Required', 'Please login to save favorites');
      return;
    }

    try {
      await toggleFavoriteMutation.mutateAsync(providerId);
      // React Query handles optimistic update automatically!
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update favorite');
    }
  };

  const handleServicePress = (serviceId: string) => {
    // ✅ NEW: Prefetch service before navigation for instant load
    prefetchService(serviceId);
    navigation.navigate('ServiceDetails', { serviceId });
  };

  const handleCallPress = async () => {
    const phoneNumber = provider?.business?.business_phone || provider?.phone;
    if (!phoneNumber) return;

    const phoneUrl = `tel:${phoneNumber}`;
    const canOpen = await Linking.canOpenURL(phoneUrl);

    if (canOpen) {
      await Linking.openURL(phoneUrl);
    } else {
      Alert.alert('Error', 'Unable to make phone call');
    }
  };

  const handleEmailPress = async () => {
    const email = provider?.business?.business_email || provider?.email;
    if (!email) return;

    const emailUrl = `mailto:${email}`;
    const canOpen = await Linking.canOpenURL(emailUrl);

    if (canOpen) {
      await Linking.openURL(emailUrl);
    } else {
      Alert.alert('Error', 'Unable to send email');
    }
  };

  if (loading && !provider) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading provider details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!provider) {
    return null;
  }

  const businessName = provider.business?.business_name || 
    `${provider.first_name} ${provider.last_name}`;
  const businessLogo = provider.business?.business_logo;
  const avatarUri = businessLogo || provider.profile_image;
  const hasActiveServices = provider.services.length > 0;
  const hasPhone = !!(provider.business?.business_phone || provider.phone);
  const hasEmail = !!(provider.business?.business_email || provider.email);
  const location = [provider.business?.city, provider.business?.country]
    .filter(Boolean)
    .join(', ');

  return (
    <View style={styles.container}>
      {/* Floating Header */}
      <SafeAreaView style={styles.headerSafe}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.headerButton}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Provider Profile</Text>
          </View>
          <TouchableOpacity
            onPress={handleToggleFavorite}
            style={styles.headerButton}
            disabled={toggleFavoriteMutation.isPending}
          >
            {toggleFavoriteMutation.isPending ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Ionicons
                name={isProviderFavorite ? 'heart' : 'heart-outline'}
                size={24}
                color={isProviderFavorite ? '#EF4444' : COLORS.text.primary}
              />
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <LinearGradient
            colors={['#F9FAFB', '#FFFFFF']}
            style={styles.profileHeaderGradient}
          >
            {avatarUri ? (
              <Image
                source={{ uri: avatarUri }}
                style={styles.profileAvatar}
              />
            ) : (
              <LinearGradient
                colors={[COLORS.primary, COLORS.secondary]}
                style={styles.profileAvatarPlaceholder}
              >
                <Text style={styles.profileAvatarText}>
                  {businessName.charAt(0).toUpperCase()}
                </Text>
              </LinearGradient>
            )}

            <Text style={styles.businessName}>{businessName}</Text>
            
            <View style={styles.ownerBadge}>
              <Ionicons name="person" size={12} color={COLORS.primary} />
              <Text style={styles.ownerText}>
                {provider.first_name} {provider.last_name}
              </Text>
            </View>

            {location && (
              <View style={styles.locationBadge}>
                <Ionicons name="location" size={14} color="#F59E0B" />
                <Text style={styles.locationText}>{location}</Text>
              </View>
            )}
          </LinearGradient>
        </View>

        {/* Description */}
        {provider.business?.business_description && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text" size={20} color={COLORS.text.primary} />
              <Text style={styles.sectionTitle}>About</Text>
            </View>
            <View style={styles.descriptionCard}>
              <Text style={styles.description}>
                {provider.business.business_description}
              </Text>
            </View>
          </View>
        )}

        {/* Contact Actions */}
        {(hasPhone || hasEmail) && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="call" size={20} color={COLORS.text.primary} />
              <Text style={styles.sectionTitle}>Get in Touch</Text>
            </View>
            
            <View style={styles.contactButtons}>
              {hasPhone && (
                <TouchableOpacity
                  onPress={handleCallPress}
                  style={styles.contactButton}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#10B981', '#059669']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.contactButtonGradient}
                  >
                    <Ionicons name="call" size={20} color="#FFF" />
                    <Text style={styles.contactButtonText}>Call Now</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}

              {hasEmail && (
                <TouchableOpacity
                  onPress={handleEmailPress}
                  style={styles.contactButton}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[COLORS.primary, COLORS.secondary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.contactButtonGradient}
                  >
                    <Ionicons name="mail" size={20} color="#FFF" />
                    <Text style={styles.contactButtonText}>Send Email</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Services Grid */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="briefcase" size={20} color={COLORS.text.primary} />
            <Text style={styles.sectionTitle}>
              Services ({provider.services.length})
            </Text>
          </View>

          {hasActiveServices ? (
            <View style={styles.servicesGrid}>
              {provider.services.map((service) => (
                <TouchableOpacity
                  key={service.id}
                  style={styles.serviceCard}
                  onPress={() => handleServicePress(service.id)}
                  activeOpacity={0.7}
                >
                  {/* Service Image */}
                  <View style={styles.serviceImageContainer}>
                    {service.images && service.images.length > 0 ? (
                      <>
                        <Image
                          source={{ uri: service.images[0] }}
                          style={styles.serviceImage}
                        />
                        <LinearGradient
                          colors={['transparent', 'rgba(0,0,0,0.7)']}
                          style={styles.serviceImageOverlay}
                        />
                      </>
                    ) : (
                      <LinearGradient
                        colors={['#F9FAFB', '#F3F4F6']}
                        style={styles.servicePlaceholder}
                      >
                        <Ionicons name="briefcase-outline" size={32} color={COLORS.text.light} />
                      </LinearGradient>
                    )}

                    {/* Price Badge */}
                    <View style={styles.priceBadge}>
                      <LinearGradient
                        colors={[COLORS.primary, COLORS.secondary]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.priceBadgeGradient}
                      >
                        <Text style={styles.priceText}>
                          QAR {Number(service.base_price).toFixed(0)}
                        </Text>
                      </LinearGradient>
                    </View>
                  </View>

                  {/* Service Info */}
                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceTitle} numberOfLines={1}>
                      {service.title}
                    </Text>
                    <Text style={styles.serviceDescription} numberOfLines={2}>
                      {service.description}
                    </Text>

                    {service.duration_minutes && (
                      <View style={styles.durationContainer}>
                        <View style={styles.durationBadge}>
                          <Ionicons name="time" size={12} color={COLORS.primary} />
                          <Text style={styles.durationText}>
                            {service.duration_minutes} min
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <LinearGradient
                colors={['#F9FAFB', '#F3F4F6']}
                style={styles.emptyIconContainer}
              >
                <Ionicons name="briefcase-outline" size={48} color={COLORS.text.light} />
              </LinearGradient>
              <Text style={styles.emptyTitle}>No services available</Text>
              <Text style={styles.emptySubtitle}>
                This provider hasn't added any services yet
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },

  // Loading
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

  // Header
  headerSafe: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Platform.OS === 'ios' ? 80 : 60,
  },

  // Profile Header
  profileHeader: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    marginHorizontal: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  profileHeaderGradient: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  profileAvatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  profileAvatarText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  businessName: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: 12,
  },
  ownerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
    marginBottom: 8,
  },
  ownerText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  locationText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F59E0B',
  },

  // Section
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
  },

  // Description
  descriptionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  description: {
    fontSize: 15,
    color: COLORS.text.secondary,
    lineHeight: 24,
  },

  // Contact Buttons
  contactButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  contactButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  contactButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  contactButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Services Grid
  servicesGrid: {
    gap: 16,
  },
  serviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  serviceImageContainer: {
    width: '100%',
    height: 180,
    position: 'relative',
  },
  serviceImage: {
    width: '100%',
    height: '100%',
  },
  serviceImageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  servicePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  priceBadgeGradient: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  serviceInfo: {
    padding: 16,
  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 6,
  },
  serviceDescription: {
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  durationContainer: {
    flexDirection: 'row',
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  durationText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
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
  },
});