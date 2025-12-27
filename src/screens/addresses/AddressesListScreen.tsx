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
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { COLORS, SIZES } from '../../constants/colors';
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
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading addresses...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>My Addresses</Text>
          <Text style={styles.headerSubtitle}>{addresses.length} saved</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('AddAddress')}
          style={styles.addButton}
        >
          <Ionicons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={() => loadAddresses(true)}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {addresses.length === 0 ? (
          <View style={styles.emptyState}>
            <LinearGradient
              colors={['#FEF3C7', '#FDE68A']}
              style={styles.emptyIconContainer}
            >
              <Ionicons name="location-outline" size={48} color="#F59E0B" />
            </LinearGradient>
            <Text style={styles.emptyTitle}>No addresses yet</Text>
            <Text style={styles.emptySubtitle}>
              Add your first address to make booking services easier
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => navigation.navigate('AddAddress')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.emptyButtonGradient}
              >
                <Ionicons name="add" size={20} color="#FFF" />
                <Text style={styles.emptyButtonText}>Add Address</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Addresses List */}
            <View style={styles.addressesList}>
              {addresses.map((address) => (
                <View key={address.id} style={styles.addressCard}>
                  {/* Header */}
                  <View style={styles.addressHeader}>
                    <View style={styles.addressLabelRow}>
                      <View style={styles.labelIconContainer}>
                        <Ionicons name="location" size={18} color="#F59E0B" />
                      </View>
                      <Text style={styles.addressLabel}>{address.label}</Text>
                      {address.is_default && (
                        <View style={styles.defaultBadge}>
                          <LinearGradient
                            colors={[COLORS.primary, COLORS.secondary]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.defaultBadgeGradient}
                          >
                            <Ionicons name="star" size={10} color="#FFF" />
                            <Text style={styles.defaultBadgeText}>Default</Text>
                          </LinearGradient>
                        </View>
                      )}
                    </View>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('EditAddress', { addressId: address.id })}
                      style={styles.editButton}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="pencil" size={18} color={COLORS.primary} />
                    </TouchableOpacity>
                  </View>

                  {/* Address Details */}
                  <View style={styles.addressDetails}>
                    <View style={styles.addressRow}>
                      <Ionicons name="home" size={14} color={COLORS.text.secondary} />
                      <Text style={styles.addressText}>{address.street_address}</Text>
                    </View>
                    <View style={styles.addressRow}>
                      <Ionicons name="business" size={14} color={COLORS.text.secondary} />
                      <Text style={styles.addressText}>
                        {[address.city, address.state, address.postal_code]
                          .filter(Boolean)
                          .join(', ')}
                      </Text>
                    </View>
                    <View style={styles.addressRow}>
                      <Ionicons name="globe" size={14} color={COLORS.text.secondary} />
                      <Text style={styles.addressText}>{address.country}</Text>
                    </View>
                  </View>

                  {/* Actions */}
                  <View style={styles.addressActions}>
                    {!address.is_default && (
                      <TouchableOpacity
                        style={styles.setDefaultButton}
                        onPress={() => handleSetDefault(address.id)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="star-outline" size={16} color={COLORS.primary} />
                        <Text style={styles.setDefaultText}>Set as Default</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDelete(address)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
                      <Text style={styles.deleteText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>

            {/* Info Box */}
            <View style={styles.infoBox}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="information-circle" size={20} color={COLORS.info} />
              </View>
              <Text style={styles.infoText}>
                Your default address will be automatically selected when booking services
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
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
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },

  // Content
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Platform.OS === 'ios' ? 24 : 24,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  emptyButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  emptyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    gap: 8,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Addresses List
  addressesList: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 16,
  },
  addressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  // Address Header
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  addressLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  labelIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  defaultBadge: {
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  defaultBadgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  defaultBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Address Details
  addressDetails: {
    gap: 10,
    marginBottom: 16,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 20,
  },

  // Address Actions
  addressActions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  setDefaultButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  setDefaultText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  deleteText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.danger,
  },

  // Info Box
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    marginHorizontal: 20,
    marginTop: 20,
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
});