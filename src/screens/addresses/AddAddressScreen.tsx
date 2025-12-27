// src/screens/addresses/AddAddressScreen.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';

import { COLORS, SIZES } from '../../constants/colors';
import { createAddress, CreateAddressInput } from '../../services/addresses';

type NavProp = NativeStackNavigationProp<any>;

export const AddAddressScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();

  const [formData, setFormData] = useState({
    label: '',
    streetAddress: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Qatar',
    isDefault: false,
    latitude: null as number | null,
    longitude: null as number | null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const [locLoading, setLocLoading] = useState(true);
  const [locError, setLocError] = useState<string | null>(null);

  const region: Region | null = useMemo(() => {
    if (formData.latitude == null || formData.longitude == null) return null;
    return {
      latitude: formData.latitude,
      longitude: formData.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  }, [formData.latitude, formData.longitude]);

  const updateField = (field: keyof typeof formData, value: string | boolean | number | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (typeof value === 'string' && errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.label.trim()) newErrors.label = 'Label is required';
    if (!formData.streetAddress.trim()) newErrors.streetAddress = 'Street address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.country.trim()) newErrors.country = 'Country is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const requestAndLoadLocation = async () => {
    setLocError(null);
    setLocLoading(true);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocError('Location permission denied');
        setLocLoading(false);
        return;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      updateField('latitude', pos.coords.latitude);
      updateField('longitude', pos.coords.longitude);
    } catch (e: any) {
      setLocError(e?.message || 'Failed to get location');
    } finally {
      setLocLoading(false);
    }
  };

  useEffect(() => {
    requestAndLoadLocation();
  }, []);

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const input: CreateAddressInput = {
        label: formData.label,
        street_address: formData.streetAddress,
        city: formData.city,
        state: formData.state || undefined,
        postal_code: formData.postalCode || undefined,
        country: formData.country,
        is_default: formData.isDefault,
        latitude: formData.latitude,
        longitude: formData.longitude,
      };

      await createAddress(input);
      Alert.alert('Success', 'Address added successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to add address');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Add New Address</Text>
          <Text style={styles.headerSubtitle}>Add a service location</Text>
        </View>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Map Section */}
          <View style={styles.mapSection}>
            <View style={styles.mapHeader}>
              <View style={styles.mapHeaderLeft}>
                <View style={styles.mapIconContainer}>
                  <Ionicons name="location" size={18} color="#F59E0B" />
                </View>
                <Text style={styles.mapTitle}>Pin Your Location</Text>
              </View>
              <TouchableOpacity 
                onPress={requestAndLoadLocation} 
                style={styles.refreshButton}
                activeOpacity={0.7}
              >
                <Ionicons name="refresh" size={16} color={COLORS.primary} />
                <Text style={styles.refreshText}>Refresh</Text>
              </TouchableOpacity>
            </View>

            {locLoading ? (
              <View style={styles.mapPlaceholder}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.mapPlaceholderText}>Getting your location...</Text>
              </View>
            ) : region ? (
              <View style={styles.mapContainer}>
                <MapView
                  style={styles.map}
                  initialRegion={region}
                  region={region}
                  showsUserLocation
                  showsMyLocationButton
                >
                  <Marker
                    coordinate={{ latitude: region.latitude, longitude: region.longitude }}
                    title="You are here"
                    description="This location will be saved"
                  />
                </MapView>
                <View style={styles.coordsContainer}>
                  <Ionicons name="location" size={12} color="#10B981" />
                  <Text style={styles.coordsText}>
                    {formData.latitude?.toFixed(6)}, {formData.longitude?.toFixed(6)}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.mapError}>
                <LinearGradient
                  colors={['#FEF2F2', '#FEE2E2']}
                  style={styles.errorIconContainer}
                >
                  <Ionicons name="location-outline" size={32} color={COLORS.danger} />
                </LinearGradient>
                <Text style={styles.errorTitle}>Location Unavailable</Text>
                <Text style={styles.errorText}>
                  {locError || 'You can still save the address without GPS'}
                </Text>
              </View>
            )}
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Address Details</Text>

            {/* Label */}
            <FormInput
              label="Address Label"
              placeholder="e.g., Home, Work, Office"
              value={formData.label}
              onChangeText={(text) => updateField('label', text)}
              error={errors.label}
              icon="pricetag"
              required
            />

            {/* Street Address */}
            <FormInput
              label="Street Address"
              placeholder="Building number, street name"
              value={formData.streetAddress}
              onChangeText={(text) => updateField('streetAddress', text)}
              error={errors.streetAddress}
              icon="home"
              required
            />

            {/* City */}
            <FormInput
              label="City"
              placeholder="e.g., Doha, Al Rayyan"
              value={formData.city}
              onChangeText={(text) => updateField('city', text)}
              error={errors.city}
              icon="business"
              required
            />

            {/* State/Region */}
            <FormInput
              label="State/Region"
              placeholder="e.g., Baladiyat ad Dawhah"
              value={formData.state}
              onChangeText={(text) => updateField('state', text)}
              icon="map"
            />

            {/* Postal Code */}
            <FormInput
              label="Postal Code"
              placeholder="e.g., 12345"
              value={formData.postalCode}
              onChangeText={(text) => updateField('postalCode', text)}
              keyboardType="numeric"
              icon="mail"
            />

            {/* Country */}
            <FormInput
              label="Country"
              placeholder="Country"
              value={formData.country}
              onChangeText={(text) => updateField('country', text)}
              error={errors.country}
              icon="globe"
              required
            />
          </View>

          {/* Default Address */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preferences</Text>
            
            <TouchableOpacity
              style={styles.defaultCard}
              onPress={() => updateField('isDefault', !formData.isDefault)}
              activeOpacity={0.7}
            >
              <View style={styles.defaultCardContent}>
                <View style={styles.checkboxContainer}>
                  {formData.isDefault ? (
                    <LinearGradient
                      colors={[COLORS.primary, COLORS.secondary]}
                      style={styles.checkbox}
                    >
                      <Ionicons name="checkmark" size={16} color="#FFF" />
                    </LinearGradient>
                  ) : (
                    <View style={styles.checkboxEmpty} />
                  )}
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.defaultLabel}>Set as default address</Text>
                  <Text style={styles.defaultHint}>
                    This address will be selected automatically for new bookings
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="information-circle" size={20} color={COLORS.info} />
            </View>
            <Text style={styles.infoText}>
              GPS coordinates help providers locate you faster and more accurately
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Actions */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={loading ? ['#9CA3AF', '#6B7280'] : [COLORS.primary, COLORS.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.saveButtonGradient}
          >
            {loading ? (
              <>
                <ActivityIndicator size="small" color="#FFF" />
                <Text style={styles.saveButtonText}>Saving...</Text>
              </>
            ) : (
              <>
                <Ionicons name="checkmark" size={20} color="#FFF" />
                <Text style={styles.saveButtonText}>Save Address</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// Form Input Component - Simplified
const FormInput: React.FC<{
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  icon: keyof typeof Ionicons.glyphMap;
  required?: boolean;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
}> = ({ label, placeholder, value, onChangeText, error, icon, required, keyboardType = 'default' }) => {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>
        {label} {required && <Text style={styles.requiredMark}>*</Text>}
      </Text>
      <View style={[styles.inputContainer, error && styles.inputContainerError]}>
        <View style={styles.inputIcon}>
          <Ionicons name={icon} size={18} color={COLORS.text.secondary} />
        </View>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.text.light}
          style={styles.input}
          keyboardType={keyboardType}
        />
      </View>
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={14} color={COLORS.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.text.secondary,
    marginTop: 2,
  },

  // Content
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Platform.OS === 'ios' ? 180 : 150,
  },

  // Map Section
  mapSection: {
    margin: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  mapHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mapIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  refreshText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  mapPlaceholder: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  mapPlaceholderText: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  mapContainer: {
    position: 'relative',
  },
  map: {
    height: 200,
  },
  coordsContainer: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  coordsText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
  },
  mapError: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  errorIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 6,
  },
  errorText: {
    fontSize: 13,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },

  // Form Section
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  formSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 16,
  },

  // Input Group - Simplified
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  requiredMark: {
    color: COLORS.danger,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  inputContainerError: {
    borderColor: COLORS.danger,
    backgroundColor: '#FEF2F2',
  },
  inputIcon: {
    width: 48,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text.primary,
    paddingVertical: 16,
    paddingRight: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    marginLeft: 4,
  },

  // Default Card
  defaultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  defaultCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  checkboxContainer: {
    padding: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxEmpty: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
  },
  defaultLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  defaultHint: {
    fontSize: 13,
    color: COLORS.text.secondary,
    lineHeight: 18,
  },

  // Info Box
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  infoIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.info,
    lineHeight: 19,
  },

  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 110 : 90, // Account for tab bar height
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  saveButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  saveButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});