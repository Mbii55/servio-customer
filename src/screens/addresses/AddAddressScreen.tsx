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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';

import { COLORS, SIZES } from '../../constants/colors';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
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

    if (!formData.label.trim()) newErrors.label = 'Label is required (e.g., Home, Work)';
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
        setLocError('Location permission denied. You can still save address without GPS.');
        setLocLoading(false);
        return;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      updateField('latitude', pos.coords.latitude);
      updateField('longitude', pos.coords.longitude);
    } catch (e: any) {
      setLocError(e?.message || 'Failed to get current location');
    } finally {
      setLocLoading(false);
    }
  };

  useEffect(() => {
    // Auto-load location once when screen opens
    requestAndLoadLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

        // ✅ store coords (can be null if permission denied)
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
        <Text style={styles.headerTitle}>Add Address</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Location Map Card */}
          <View style={styles.mapCard}>
            <View style={styles.mapHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="location-outline" size={18} color={COLORS.primary} />
                <Text style={styles.mapTitle}>Current Location</Text>
              </View>

              <TouchableOpacity onPress={requestAndLoadLocation} style={styles.refreshBtn} activeOpacity={0.8}>
                <Ionicons name="refresh-outline" size={18} color={COLORS.primary} />
                <Text style={styles.refreshText}>Refresh</Text>
              </TouchableOpacity>
            </View>

            {locLoading ? (
              <View style={styles.mapLoading}>
                <ActivityIndicator color={COLORS.primary} />
                <Text style={styles.mapHint}>Getting your location…</Text>
              </View>
            ) : region ? (
              <>
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
                    description="This point will be saved with your address"
                  />
                </MapView>

                <Text style={styles.coordsText}>
                  Lat: {formData.latitude?.toFixed(6)}   •   Lng: {formData.longitude?.toFixed(6)}
                </Text>
              </>
            ) : (
              <View style={styles.mapError}>
                <Ionicons name="alert-circle-outline" size={22} color={COLORS.text.secondary} />
                <Text style={styles.mapHint}>
                  {locError || 'Location unavailable. You can still save address without GPS.'}
                </Text>
              </View>
            )}
          </View>

          {/* Label */}
          <Input
            label="Address Label *"
            placeholder="e.g., Home, Work, Office"
            value={formData.label}
            onChangeText={(text) => updateField('label', text)}
            error={errors.label}
            icon="pricetag-outline"
          />

          {/* Street Address */}
          <Input
            label="Street Address *"
            placeholder="Building number, street name"
            value={formData.streetAddress}
            onChangeText={(text) => updateField('streetAddress', text)}
            error={errors.streetAddress}
            icon="home-outline"
          />

          {/* City */}
          <Input
            label="City *"
            placeholder="e.g., Doha, Al Rayyan"
            value={formData.city}
            onChangeText={(text) => updateField('city', text)}
            error={errors.city}
            icon="business-outline"
          />

          {/* State/Region */}
          <Input
            label="State/Region (Optional)"
            placeholder="e.g., Baladiyat ad Dawhah"
            value={formData.state}
            onChangeText={(text) => updateField('state', text)}
            icon="map-outline"
          />

          {/* Postal Code */}
          <Input
            label="Postal Code (Optional)"
            placeholder="e.g., 12345"
            value={formData.postalCode}
            onChangeText={(text) => updateField('postalCode', text)}
            keyboardType="numeric"
            icon="mail-outline"
          />

          {/* Country */}
          <Input
            label="Country *"
            placeholder="Country"
            value={formData.country}
            onChangeText={(text) => updateField('country', text)}
            error={errors.country}
            icon="globe-outline"
          />

          {/* Set as Default */}
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => updateField('isDefault', !formData.isDefault)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={formData.isDefault ? 'checkbox' : 'square-outline'}
              size={24}
              color={formData.isDefault ? COLORS.primary : COLORS.text.light}
            />
            <View style={styles.checkboxTextContainer}>
              <Text style={styles.checkboxLabel}>Set as default address</Text>
              <Text style={styles.checkboxHint}>
                This address will be selected automatically for new bookings
              </Text>
            </View>
          </TouchableOpacity>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={20} color={COLORS.info} />
            <Text style={styles.infoText}>
              Make sure the address is accurate. Your GPS coordinates (if allowed) help providers locate you faster.
            </Text>
          </View>

          {/* Save Button */}
          <Button
            title="Save Address"
            onPress={handleSubmit}
            loading={loading}
            variant="primary"
            style={styles.saveButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background.secondary },

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
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: SIZES.h4, fontWeight: 'bold', color: COLORS.text.primary },

  content: { flex: 1 },
  contentContainer: { padding: SIZES.padding },

  // Map Card
  mapCard: {
    backgroundColor: COLORS.background.primary,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    overflow: 'hidden',
  },
  mapHeader: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mapTitle: { fontSize: SIZES.body, fontWeight: '700', color: COLORS.text.primary },
  refreshBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6 },
  refreshText: { fontSize: SIZES.small, color: COLORS.primary, fontWeight: '600' },
  map: { height: 220, width: '100%' },
  coordsText: {
    padding: 12,
    fontSize: SIZES.small,
    color: COLORS.text.secondary,
  },
  mapLoading: { height: 220, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 12 },
  mapError: { height: 220, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 12 },
  mapHint: { fontSize: SIZES.small, color: COLORS.text.secondary, textAlign: 'center', lineHeight: 18 },

  // Checkbox
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.background.primary,
    padding: 16,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  checkboxTextContainer: { flex: 1, marginLeft: 12 },
  checkboxLabel: { fontSize: SIZES.body, fontWeight: '600', color: COLORS.text.primary, marginBottom: 4 },
  checkboxHint: { fontSize: SIZES.small, color: COLORS.text.secondary, lineHeight: 18 },

  // Info box
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.info + '15',
    padding: 12,
    borderRadius: SIZES.radius,
    gap: 8,
    marginBottom: 24,
  },
  infoText: { flex: 1, fontSize: SIZES.small, color: COLORS.info, lineHeight: 18 },

  saveButton: { marginBottom: 20 },
});
