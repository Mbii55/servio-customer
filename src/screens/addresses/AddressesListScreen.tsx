// src/screens/addresses/AddressesListScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { COLORS, SIZES } from '../../constants/colors';
import { Button } from '../../components/common/Button';
import {
  getMyAddresses,
  deleteAddress,
  setDefaultAddress,
  updateAddress,
} from '../../services/addresses';
import { Address } from '../../types';

type NavProp = NativeStackNavigationProp<any>;

export const AddressesListScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadAddresses();
    }, [])
  );

  const loadAddresses = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const data = await getMyAddresses();
      setAddresses(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load addresses');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

 const handleSetDefault = async (addressId: string) => {
  try {
    // Update UI optimistically
    setAddresses(prevAddresses => 
      prevAddresses.map(addr => ({
        ...addr,
        is_default: addr.id === addressId
      }))
    );
    
    // Update backend
    await updateAddress(addressId, { is_default: true });
    
    // Refresh from server to ensure consistency
    const freshData = await getMyAddresses();
    setAddresses(freshData);
    
    Alert.alert('Success', 'Default address updated');
  } catch (error: any) {
    // On error, reload from server
    await loadAddresses();
    Alert.alert(
      'Error', 
      error.response?.data?.message || 
      error.response?.data?.error || 
      'Failed to set default address'
    );
  }
};

  const handleDelete = async (address: Address) => {
    if (address.is_default) {
      Alert.alert(
        'Cannot Delete',
        'You cannot delete your default address. Please set another address as default first.'
      );
      return;
    }

    Alert.alert(
      'Delete Address',
      `Are you sure you want to delete "${address.label}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAddress(address.id);
              await loadAddresses();
              Alert.alert('Success', 'Address deleted successfully');
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.error || 'Failed to delete address');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
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
        <Text style={styles.headerTitle}>My Addresses</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('AddAddress')}
          style={styles.addButton}
        >
          <Ionicons name="add" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadAddresses(true)} />
        }
      >
        {addresses.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="location-outline" size={64} color={COLORS.text.light} />
            </View>
            <Text style={styles.emptyTitle}>No Addresses Yet</Text>
            <Text style={styles.emptyText}>
              Add your first address to make booking services easier
            </Text>
            <Button
              title="Add Address"
              onPress={() => navigation.navigate('AddAddress')}
              variant="primary"
              style={{ marginTop: 24 }}
            />
          </View>
        ) : (
          <View style={styles.addressesList}>
            {addresses.map((address) => (
              <View key={address.id} style={styles.addressCard}>
                {/* Header */}
                <View style={styles.addressHeader}>
                  <View style={styles.addressLabelRow}>
                    <Ionicons name="location" size={20} color={COLORS.primary} />
                    <Text style={styles.addressLabel}>{address.label}</Text>
                    {address.is_default && (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultBadgeText}>Default</Text>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('EditAddress', { addressId: address.id })}
                    style={styles.editButton}
                  >
                    <Ionicons name="pencil-outline" size={20} color={COLORS.text.secondary} />
                  </TouchableOpacity>
                </View>

                {/* Address Details */}
                <View style={styles.addressDetails}>
                  <Text style={styles.addressText}>{address.street_address}</Text>
                  <Text style={styles.addressText}>
                    {[address.city, address.state, address.postal_code]
                      .filter(Boolean)
                      .join(', ')}
                  </Text>
                  <Text style={styles.addressText}>{address.country}</Text>
                </View>

                {/* Actions */}
                <View style={styles.addressActions}>
                  {!address.is_default && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleSetDefault(address.id)}
                    >
                      <Ionicons name="star-outline" size={18} color={COLORS.primary} />
                      <Text style={styles.actionButtonText}>Set as Default</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDelete(address)}
                  >
                    <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
                    <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Info */}
        {addresses.length > 0 && (
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={20} color={COLORS.info} />
            <Text style={styles.infoText}>
              Your default address will be automatically selected when booking services.
            </Text>
          </View>
        )}
      </ScrollView>
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
  addButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SIZES.padding,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: SIZES.h3,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: SIZES.body,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  addressesList: {
    gap: 16,
  },
  addressCard: {
    backgroundColor: COLORS.background.primary,
    borderRadius: SIZES.radius,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addressLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  addressLabel: {
    fontSize: SIZES.body,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  defaultBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  editButton: {
    padding: 4,
  },
  addressDetails: {
    gap: 4,
    marginBottom: 12,
  },
  addressText: {
    fontSize: SIZES.small,
    color: COLORS.text.secondary,
    lineHeight: 20,
  },
  addressActions: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: COLORS.background.secondary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionButtonText: {
    fontSize: SIZES.small,
    fontWeight: '600',
    color: COLORS.primary,
  },
  deleteButton: {
    borderColor: COLORS.danger + '30',
  },
  deleteButtonText: {
    color: COLORS.danger,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.info + '15',
    padding: 12,
    borderRadius: SIZES.radius,
    gap: 8,
    marginTop: 16,
  },
  infoText: {
    flex: 1,
    fontSize: SIZES.small,
    color: COLORS.info,
    lineHeight: 18,
  },
});