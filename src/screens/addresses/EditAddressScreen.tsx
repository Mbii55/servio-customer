// src/screens/addresses/EditAddressScreen.tsx
import React, { useState, useEffect } from 'react';
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
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { COLORS, SIZES } from '../../constants/colors';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import {
  getMyAddresses,
  updateAddress,
  UpdateAddressInput,
} from '../../services/addresses';
import { Address } from '../../types';

type Params = { addressId: string };
type NavProp = NativeStackNavigationProp<any>;

export const EditAddressScreen: React.FC = () => {
  const route = useRoute<RouteProp<Record<string, Params>, string>>();
  const navigation = useNavigation<NavProp>();
  const { addressId } = route.params;

  const [address, setAddress] = useState<Address | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    label: '',
    streetAddress: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    isDefault: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadAddress();
  }, [addressId]);

  const loadAddress = async () => {
    setLoading(true);
    try {
      const addresses = await getMyAddresses();
      const found = addresses.find((a) => a.id === addressId);

      if (!found) {
        Alert.alert('Error', 'Address not found', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
        return;
      }

      setAddress(found);
      setFormData({
        label: found.label,
        streetAddress: found.street_address,
        city: found.city,
        state: found.state || '',
        postalCode: found.postal_code || '',
        country: found.country,
        isDefault: found.is_default,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to load address', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.label.trim()) {
      newErrors.label = 'Label is required';
    }

    if (!formData.streetAddress.trim()) {
      newErrors.streetAddress = 'Street address is required';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.country.trim()) {
      newErrors.country = 'Country is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const input: UpdateAddressInput = {
        label: formData.label,
        street_address: formData.streetAddress,
        city: formData.city,
        state: formData.state || undefined,
        postal_code: formData.postalCode || undefined,
        country: formData.country,
        is_default: formData.isDefault,
      };

      await updateAddress(addressId, input);
      Alert.alert('Success', 'Address updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to update address');
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = (field: keyof typeof formData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (typeof value === 'string' && errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!address) {
    return (
      <View style={styles.center}>
        <Text>Address not found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Address</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
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

          {/* Save Button */}
          <Button
            title="Update Address"
            onPress={handleSubmit}
            loading={submitting}
            variant="primary"
            style={styles.saveButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: SIZES.h4,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SIZES.padding,
  },
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
  checkboxTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  checkboxLabel: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  checkboxHint: {
    fontSize: SIZES.small,
    color: COLORS.text.secondary,
    lineHeight: 18,
  },
  saveButton: {
    marginBottom: 20,
  },
});