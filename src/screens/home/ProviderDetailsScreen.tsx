// src/screens/home/ProviderDetailsScreen.tsx
import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SIZES } from '../../constants/colors';
import api from '../../services/api';
import { HomeStackParamList } from '../../navigation/types';
import { getProviderFavoriteStatus, toggleProviderFavorite } from '../../services/favorites';
import { useAuth } from '../../context/AuthContext';

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

  const [provider, setProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProviderFavorite, setIsProviderFavorite] = useState(false);
  
  useEffect(() => {
    fetchProviderDetails();
  }, [providerId]);

  useEffect(() => {
    const loadFavoriteStatus = async () => {
      if (!isAuthenticated) {
        setIsProviderFavorite(false);
        return;
      }
      try {
        const status = await getProviderFavoriteStatus(providerId);
        setIsProviderFavorite(status.is_favorite);
      } catch (error) {
        console.error('Error loading favorite status:', error);
      }
    };

    if (provider) {
      loadFavoriteStatus();
    }
  }, [isAuthenticated, providerId, provider]);

  const fetchProviderDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/users/providers/${providerId}`);
      setProvider(response.data.provider);
    } catch (error: any) {
      console.error('Error fetching provider details:', error);
      Alert.alert(
        'Error',
        error.response?.data?.error || 'Failed to load provider details',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      Alert.alert('Login Required', 'Please login to save favorites');
      return;
    }

    const previousState = isProviderFavorite;
    setIsProviderFavorite(!previousState);

    try {
      const result = await toggleProviderFavorite(providerId);
      setIsProviderFavorite(result.is_favorite);
    } catch (error: any) {
      setIsProviderFavorite(previousState);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update favorite');
    }
  };

  const handleServicePress = (serviceId: string) => {
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading provider details...</Text>
      </View>
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Favorite Button */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Provider Details</Text>
        <TouchableOpacity
          onPress={handleToggleFavorite}
          style={styles.favoriteButton}
        >
          <Ionicons
            name={isProviderFavorite ? 'heart' : 'heart-outline'}
            size={24}
            color={isProviderFavorite ? COLORS.danger : COLORS.text.primary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Business Info Card */}
        <View style={styles.businessCard}>
          <View style={styles.businessHeader}>
            <View style={styles.businessAvatar}>
              {avatarUri ? (
                <Image
                  source={{ uri: avatarUri }}
                  style={styles.avatarImage}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {businessName.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.businessInfo}>
              <Text style={styles.businessName} numberOfLines={2}>
                {businessName}
              </Text>
              <View style={styles.ownerInfo}>
                <Ionicons name="person-outline" size={14} color={COLORS.text.secondary} />
                <Text style={styles.ownerText}>
                  {provider.first_name} {provider.last_name}
                </Text>
              </View>
              {provider.business?.country && (
                <View style={styles.locationInfo}>
                  <Ionicons name="location-outline" size={14} color={COLORS.text.secondary} />
                  <Text style={styles.locationText}>{provider.business.country}</Text>
                </View>
              )}
            </View>
          </View>

          {provider.business?.business_description && (
            <Text style={styles.businessDescription}>
              {provider.business.business_description}
            </Text>
          )}

          {/* Contact Buttons */}
          {(hasPhone || hasEmail) && (
            <View style={styles.contactButtons}>
              {hasPhone && (
                <TouchableOpacity
                  onPress={handleCallPress}
                  style={styles.contactButton}
                  activeOpacity={0.7}
                >
                  <View style={[styles.contactButtonContent, styles.callButton]}>
                    <Ionicons name="call-outline" size={20} color="#fff" />
                    <Text style={styles.contactButtonText}>Call</Text>
                  </View>
                </TouchableOpacity>
              )}

              {hasEmail && (
                <TouchableOpacity
                  onPress={handleEmailPress}
                  style={styles.contactButton}
                  activeOpacity={0.7}
                >
                  <View style={[styles.contactButtonContent, styles.emailButton]}>
                    <Ionicons name="mail-outline" size={20} color="#fff" />
                    <Text style={styles.contactButtonText}>Email</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Services Section */}
        <View style={styles.servicesSection}>
          <Text style={styles.sectionTitle}>
            Services ({provider.services.length})
          </Text>

          {hasActiveServices ? (
            provider.services.map((service) => (
              <TouchableOpacity
                key={service.id}
                style={styles.serviceCard}
                onPress={() => handleServicePress(service.id)}
                activeOpacity={0.7}
              >
                <View style={styles.serviceContent}>
                  {service.images && service.images.length > 0 ? (
                    <Image
                      source={{ uri: service.images[0] }}
                      style={styles.serviceImage}
                    />
                  ) : (
                    <View style={styles.servicePlaceholder}>
                      <Ionicons name="briefcase-outline" size={32} color={COLORS.text.light} />
                    </View>
                  )}

                  <View style={styles.serviceDetails}>
                    <Text style={styles.serviceTitle} numberOfLines={1}>
                      {service.title}
                    </Text>
                    <Text style={styles.serviceDescription} numberOfLines={2}>
                      {service.description}
                    </Text>
                    <View style={styles.serviceMeta}>
                      <View style={styles.priceTag}>
                        <Text style={styles.priceText}>
                          QAR {Number(service.base_price).toFixed(2)}
                        </Text>
                      </View>
                      {service.duration_minutes && (
                        <View style={styles.durationTag}>
                          <Ionicons name="time-outline" size={14} color={COLORS.text.secondary} />
                          <Text style={styles.durationText}>
                            {service.duration_minutes} min
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <Ionicons name="chevron-forward" size={20} color={COLORS.text.light} />
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="briefcase-outline" size={64} color={COLORS.text.light} />
              <Text style={styles.emptyStateText}>No services available</Text>
            </View>
          )}
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background.primary,
  },
  loadingText: {
    marginTop: 12,
    fontSize: SIZES.body,
    color: COLORS.text.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.padding,
    paddingVertical: 12,
    backgroundColor: COLORS.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: SIZES.h4,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  headerPlaceholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  businessCard: {
    backgroundColor: COLORS.background.secondary,
    margin: SIZES.padding,
    borderRadius: SIZES.radius,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  businessHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  businessAvatar: {
    marginRight: 16,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '600',
    color: '#fff',
  },
  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  businessInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  businessName: {
    fontSize: SIZES.h3,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  ownerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ownerText: {
    fontSize: SIZES.small,
    color: COLORS.text.secondary,
    marginLeft: 6,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: SIZES.small,
    color: COLORS.text.secondary,
    marginLeft: 6,
  },
  businessDescription: {
    fontSize: SIZES.body,
    color: COLORS.text.secondary,
    lineHeight: 22,
    marginBottom: 16,
  },
  contactButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  contactButton: {
    flex: 1,
  },
  contactButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: SIZES.radius,
    gap: 8,
  },
  callButton: {
    backgroundColor: COLORS.primary,
  },
  emailButton: {
    backgroundColor: COLORS.success,
  },
  contactButtonText: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: '#fff',
  },
  servicesSection: {
    paddingHorizontal: SIZES.padding,
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: SIZES.h3,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 16,
  },
  serviceCard: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: SIZES.radius,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  serviceContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  serviceImage: {
    width: 80,
    height: 80,
    borderRadius: SIZES.radius,
  },
  servicePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceDetails: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  serviceTitle: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: SIZES.small,
    color: COLORS.text.secondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  serviceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priceTag: {
    backgroundColor: COLORS.background.tertiary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priceText: {
    fontSize: SIZES.small,
    fontWeight: '600',
    color: COLORS.primary,
  },
  durationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  durationText: {
    fontSize: SIZES.small,
    color: COLORS.text.secondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: SIZES.body,
    color: COLORS.text.secondary,
  },
});