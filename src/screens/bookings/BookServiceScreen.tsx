// src/screens/booking/BookServiceScreen.tsx
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  TextInput,
  Alert,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';

import { COLORS, SIZES } from '../../constants/colors';
import { useBooking } from '../../context/BookingContext';
import { createBooking } from '../../services/bookings';
import api from '../../services/api';
import { ServiceAddon, Address } from '../../types';
import { CalendarPicker } from '../../components/booking/CalendarPicker';
import { TimeSlotPicker } from '../../components/booking/TimeSlotPicker';

// ✅ NEW: Import React Query hooks for data fetching only
import { useService } from '../../hooks/useServices';
import { useAddresses } from '../../hooks/useAddresses';
import { useQuery } from '@tanstack/react-query';

type Params = { serviceId: string };
type NavProp = NativeStackNavigationProp<any>;

type BookingStep = 'datetime' | 'address' | 'addons' | 'review';

type SlotUI = { time: string; available: boolean };

export const BookServiceScreen: React.FC = () => {
  const route = useRoute<RouteProp<Record<string, Params>, string>>();
  const navigation = useNavigation<NavProp>();
  const { serviceId } = route.params;

  const { bookingData, updateBookingData, resetBookingData } = useBooking();

  // ✅ UPDATED: Use React Query for service data (instant if cached from ServiceDetailsScreen)
  const { 
    data: service, 
    isLoading: serviceLoading 
  } = useService(serviceId);

  // ✅ UPDATED: Use React Query for addresses (instant if cached from AddressesListScreen)
  const { 
    data: addresses = [], 
    refetch: refetchAddresses 
  } = useAddresses();

  // ✅ UPDATED: Use React Query for addons (cached per service)
  const { 
    data: addons = [] 
  } = useQuery({
    queryKey: ['addons', 'service', serviceId],
    queryFn: async () => {
      try {
        const response = await api.get(`/addons/service/${serviceId}`);
        return ((response.data || []) as ServiceAddon[]).filter((a) => a.is_active);
      } catch (error) {
        console.error('Failed to load addons:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!serviceId,
  });

  // ✅ KEEP: All form state remains manual (ephemeral booking flow state)
  const [currentStep, setCurrentStep] = useState<BookingStep>('datetime');
  const [submitting, setSubmitting] = useState(false);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimeStr, setSelectedTimeStr] = useState<string | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [customerNotes, setCustomerNotes] = useState('');

  const [timeSlots, setTimeSlots] = useState<SlotUI[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsMessage, setSlotsMessage] = useState<string>('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  // ✅ SIMPLIFIED: Initialize booking data and default address
  useEffect(() => {
    if (service) {
      updateBookingData({ serviceId });
    }

    // Set default address
    const defaultAddr = addresses.find((a) => a.is_default);
    if (defaultAddr && !selectedAddressId) {
      setSelectedAddressId(defaultAddr.id);
    }

    return () => {
      resetBookingData();
    };
  }, [serviceId, service, addresses]);

  // ✅ KEEP: Refresh addresses when returning to address step
  useFocusEffect(
    useCallback(() => {
      if (currentStep === 'address') {
        refetchAddresses();
      }
    }, [currentStep])
  );

  // ✅ KEEP: Time slots need fresh data (not cached)
  const loadSlotsForSelectedDate = async (date: Date) => {
    if (!service) return;

    const providerId =
      (service as any)?.provider?.id ||
      (service as any)?.provider_id ||
      (service as any)?.providerId;

    const duration = Number((service as any)?.duration_minutes || 60);

    if (!providerId) {
      setTimeSlots([]);
      setSlotsMessage('Provider not found for this service');
      return;
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    setSlotsLoading(true);
    setSlotsMessage('');
    setSelectedTimeStr(null);
    setTimeSlots([]);

    try {
      const res = await api.get(`/availability/provider/${providerId}/slots`, {
        params: { date: dateStr, serviceDuration: String(duration) },
      });

      const backendSlots = (res.data?.slots || []) as string[];
      const uiSlots: SlotUI[] = backendSlots.map((time) => ({
        time,
        available: true,
      }));

      setTimeSlots(uiSlots);

      if (uiSlots.length === 0) {
        setSlotsMessage(res.data?.message || 'No available slots on this date');
      }
    } catch (e: any) {
      console.error('Error loading slots:', e);
      setTimeSlots([]);
      setSlotsMessage(e?.response?.data?.error || 'Failed to load available slots');
    } finally {
      setSlotsLoading(false);
    }
  };

  const pricing = useMemo(() => {
    const servicePrice = Number(service?.base_price || 0);
    const addonsPrice = selectedAddonIds.reduce((sum, addonId) => {
      const addon = addons.find((a) => a.id === addonId);
      return sum + Number(addon?.price || 0);
    }, 0);

    return {
      servicePrice,
      addonsPrice,
      subtotal: servicePrice + addonsPrice,
    };
  }, [service, addons, selectedAddonIds]);

  const validateDateTime = () => {
    const newErrors: Record<string, string> = {};

    if (!selectedDate) {
      newErrors.date = 'Please select a date';
    }

    if (!selectedTimeStr) {
      newErrors.time = 'Please select a time';
    } else {
      const slot = timeSlots.find((s) => s.time === selectedTimeStr);
      if (slot && !slot.available) {
        newErrors.time = 'This time is not available. Please choose another slot.';
      }
      if (timeSlots.length > 0 && !slot) {
        newErrors.time = 'Please select a valid time slot.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateAddress = () => {
    const newErrors: Record<string, string> = {};

    if (!selectedAddressId) {
      newErrors.address = 'Please select or add an address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const goToNextStep = () => {
    setErrors({});

    if (currentStep === 'datetime') {
      if (!validateDateTime()) return;
      setCurrentStep('address');
    } else if (currentStep === 'address') {
      if (!validateAddress()) return;
      setCurrentStep('addons');
    } else if (currentStep === 'addons') {
      setCurrentStep('review');
    }
  };

  const goToPreviousStep = () => {
    setErrors({});

    if (currentStep === 'address') {
      setCurrentStep('datetime');
    } else if (currentStep === 'addons') {
      setCurrentStep('address');
    } else if (currentStep === 'review') {
      setCurrentStep('addons');
    }
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTimeStr) {
      Alert.alert('Error', 'Please complete all required fields');
      return;
    }

    const slot = timeSlots.find((s) => s.time === selectedTimeStr);
    if (slot && !slot.available) {
      Alert.alert('Error', 'This time slot is not available. Please choose another one.');
      return;
    }

    setSubmitting(true);

    try {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      const timeStr = selectedTimeStr + ':00';

      const bookingInput = {
        service_id: serviceId,
        scheduled_date: dateStr,
        scheduled_time: timeStr,
        address_id: selectedAddressId || undefined,
        addons:
          selectedAddonIds.length > 0
            ? selectedAddonIds.map((id) => ({ addon_id: id, quantity: 1 }))
            : undefined,
        customer_notes: customerNotes || undefined,
        payment_method: 'cash' as const,
      };

      const booking = await createBooking(bookingInput);

      resetBookingData();
      navigation.replace('BookingSuccess', { bookingId: booking.id });
    } catch (error: any) {
      Alert.alert(
        'Booking Failed',
        error.response?.data?.error || 'Failed to create booking. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const toggleAddon = (addonId: string) => {
    setSelectedAddonIds((prev) =>
      prev.includes(addonId) ? prev.filter((id) => id !== addonId) : [...prev, addonId]
    );
  };

  const formatTime = (time: string) => {
    const [hour, minute] = time.split(':');
    const hourNum = parseInt(hour);
    const period = hourNum >= 12 ? 'PM' : 'AM';
    const hour12 = hourNum > 12 ? hourNum - 12 : hourNum === 0 ? 12 : hourNum;
    return `${hour12}:${minute} ${period}`;
  };

  const handleAddAddressPress = async () => {
    navigation.navigate('AddAddress', {
      onAddressAdded: async () => {
        // Refetch addresses after adding new one
        const { data: updatedAddresses } = await refetchAddresses();
        
        if (updatedAddresses && updatedAddresses.length > 0) {
          const newDefault = updatedAddresses.find(a => a.is_default);
          if (newDefault) {
            setSelectedAddressId(newDefault.id);
          } else if (updatedAddresses.length === 1) {
            setSelectedAddressId(updatedAddresses[0].id);
          }
        }
      }
    });
  };

  // ✅ SIMPLIFIED: Loading state only checks service (addresses/addons load in background)
  const loading = serviceLoading && !service;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading booking details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!service) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Service not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const provider = (service as any).provider;
  const bp = provider?.business_profile;
  const shopName = bp?.business_name || `${provider?.first_name || ''} ${provider?.last_name || ''}`.trim();

  const minDate = new Date();
  minDate.setHours(0, 0, 0, 0);

  const maxDate = new Date(minDate);
  maxDate.setDate(maxDate.getDate() + 30);

  const steps = [
    { key: 'datetime', label: 'Date & Time', icon: 'calendar' },
    { key: 'address', label: 'Location', icon: 'location' },
    { key: 'addons', label: 'Add-ons', icon: 'add-circle' },
    { key: 'review', label: 'Review', icon: 'checkmark-circle' },
  ];

  const currentStepIndex = steps.findIndex(s => s.key === currentStep);

  return (
    <View style={styles.container}>
      {/* Header */}
      <SafeAreaView style={styles.headerSafe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="close" size={28} color={COLORS.text.primary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>{service.title}</Text>
            <Text style={styles.headerSubtitle}>by {shopName}</Text>
          </View>
          <View style={styles.stepIndicator}>
            <Text style={styles.stepIndicatorText}>{currentStepIndex + 1}/4</Text>
          </View>
        </View>

        {/* Step Pills */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.stepPillsContainer}
        >
          {steps.map((step, index) => {
            const isActive = step.key === currentStep;
            const isCompleted = index < currentStepIndex;
            
            return (
              <View key={step.key} style={styles.stepPillWrapper}>
                {isActive ? (
                  <LinearGradient
                    colors={[COLORS.primary, COLORS.secondary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.stepPill}
                  >
                    <Ionicons name={step.icon as any} size={16} color="#FFF" />
                    <Text style={styles.stepPillTextActive}>{step.label}</Text>
                  </LinearGradient>
                ) : (
                  <View style={[styles.stepPill, isCompleted && styles.stepPillCompleted]}>
                    <Ionicons 
                      name={isCompleted ? 'checkmark' : `${step.icon}-outline` as any} 
                      size={16} 
                      color={isCompleted ? COLORS.success : COLORS.text.secondary} 
                    />
                    <Text style={[styles.stepPillText, isCompleted && styles.stepPillTextCompleted]}>
                      {step.label}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      </SafeAreaView>

      {/* Content */}
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* DateTime Step */}
        {currentStep === 'datetime' && (
          <View style={styles.stepContent}>
            <Text style={styles.questionText}>When do you need this service?</Text>

            <CalendarPicker
              selectedDate={selectedDate}
              onDateSelect={(date) => {
                setSelectedDate(date);
                loadSlotsForSelectedDate(date);
                setErrors((prev) => {
                  const newErrors = { ...prev };
                  delete newErrors.date;
                  return newErrors;
                });
              }}
              minDate={minDate}
              maxDate={maxDate}
            />

            {errors.date && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color={COLORS.danger} />
                <Text style={styles.errorText}>{errors.date}</Text>
              </View>
            )}

            {selectedDate && (
              <View style={styles.timeSlotsSection}>
                <Text style={styles.sectionLabel}>Select Time</Text>
                {slotsLoading ? (
                  <View style={styles.loadingSlots}>
                    <ActivityIndicator size="small" color={COLORS.primary} />
                    <Text style={styles.loadingSlotsText}>Loading available times...</Text>
                  </View>
                ) : (
                  <>
                    <TimeSlotPicker
                      selectedTime={selectedTimeStr}
                      onTimeSelect={(time) => {
                        const slot = timeSlots.find((s) => s.time === time);
                        if (slot && !slot.available) return;

                        setSelectedTimeStr(time);
                        setErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors.time;
                          return newErrors;
                        });
                      }}
                      timeSlots={timeSlots}
                    />

                    {!!slotsMessage && (
                      <View style={styles.infoBox}>
                        <Ionicons name="information-circle" size={18} color={COLORS.info} />
                        <Text style={styles.infoText}>{slotsMessage}</Text>
                      </View>
                    )}
                  </>
                )}

                {errors.time && (
                  <View style={styles.errorBox}>
                    <Ionicons name="alert-circle" size={16} color={COLORS.danger} />
                    <Text style={styles.errorText}>{errors.time}</Text>
                  </View>
                )}
              </View>
            )}

            {service.duration_minutes && (
              <View style={styles.durationBox}>
                <Ionicons name="time" size={18} color={COLORS.primary} />
                <Text style={styles.durationText}>
                  Service duration: <Text style={styles.durationValue}>{service.duration_minutes} min</Text>
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Address Step */}
        {currentStep === 'address' && (
          <View style={styles.stepContent}>
            <View style={styles.questionRow}>
              <Text style={styles.questionText}>Where should we come?</Text>
              <TouchableOpacity
                onPress={handleAddAddressPress}
                style={styles.addNewButton}
              >
                <Ionicons name="add" size={18} color={COLORS.primary} />
                <Text style={styles.addNewText}>Add New</Text>
              </TouchableOpacity>
            </View>

            {addresses.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="location-outline" size={48} color={COLORS.text.light} />
                </View>
                <Text style={styles.emptyTitle}>No addresses saved</Text>
                <Text style={styles.emptySubtitle}>Add an address to continue with your booking</Text>
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={handleAddAddressPress}
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
              <View style={styles.addressList}>
                {addresses.map((address) => {
                  const isSelected = selectedAddressId === address.id;
                  
                  return (
                    <TouchableOpacity
                      key={address.id}
                      style={[styles.addressCard, isSelected && styles.addressCardSelected]}
                      onPress={() => setSelectedAddressId(address.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.addressRadio}>
                        {isSelected ? (
                          <LinearGradient
                            colors={[COLORS.primary, COLORS.secondary]}
                            style={styles.radioSelected}
                          >
                            <Ionicons name="checkmark" size={12} color="#FFF" />
                          </LinearGradient>
                        ) : (
                          <View style={styles.radioUnselected} />
                        )}
                      </View>

                      <View style={{ flex: 1 }}>
                        <View style={styles.addressLabelRow}>
                          <Text style={styles.addressLabel}>{address.label}</Text>
                          {address.is_default && (
                            <View style={styles.defaultBadge}>
                              <Text style={styles.defaultBadgeText}>Default</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.addressText}>{address.street_address}</Text>
                        <Text style={styles.addressText}>
                          {address.city}, {address.country}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {errors.address && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color={COLORS.danger} />
                <Text style={styles.errorText}>{errors.address}</Text>
              </View>
            )}
          </View>
        )}

        {/* Addons Step */}
        {currentStep === 'addons' && (
          <View style={styles.stepContent}>
            <Text style={styles.questionText}>Add extra services? (Optional)</Text>

            {addons.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="grid-outline" size={48} color={COLORS.text.light} />
                </View>
                <Text style={styles.emptyTitle}>No add-ons available</Text>
                <Text style={styles.emptySubtitle}>This service doesn't have any additional options</Text>
              </View>
            ) : (
              <View style={styles.addonsList}>
                {addons.map((addon) => {
                  const isSelected = selectedAddonIds.includes(addon.id);
                  
                  return (
                    <TouchableOpacity
                      key={addon.id}
                      style={[styles.addonCard, isSelected && styles.addonCardSelected]}
                      onPress={() => toggleAddon(addon.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.addonCheckbox}>
                        {isSelected ? (
                          <LinearGradient
                            colors={[COLORS.primary, COLORS.secondary]}
                            style={styles.checkboxSelected}
                          >
                            <Ionicons name="checkmark" size={14} color="#FFF" />
                          </LinearGradient>
                        ) : (
                          <View style={styles.checkboxUnselected} />
                        )}
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={styles.addonName}>{addon.name}</Text>
                        {addon.description && (
                          <Text style={styles.addonDescription}>{addon.description}</Text>
                        )}
                      </View>

                      <Text style={styles.addonPrice}>+{Number(addon.price).toFixed(0)}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* Review Step */}
        {currentStep === 'review' && (
          <View style={styles.stepContent}>
            <Text style={styles.questionText}>Review your booking</Text>

            {/* Summary Card */}
            <View style={styles.summaryCard}>
              <View style={styles.summarySection}>
                <View style={styles.summaryIconContainer}>
                  <Ionicons name="calendar" size={16} color={COLORS.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.summaryLabel}>Date & Time</Text>
                  <Text style={styles.summaryValue}>
                    {selectedDate?.toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                  <Text style={styles.summaryValue}>
                    {selectedTimeStr && formatTime(selectedTimeStr)}
                  </Text>
                </View>
              </View>

              {selectedAddressId && (
                <View style={styles.summarySection}>
                  <View style={styles.summaryIconContainer}>
                    <Ionicons name="location" size={16} color="#F59E0B" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.summaryLabel}>Location</Text>
                    {(() => {
                      const addr = addresses.find((a) => a.id === selectedAddressId);
                      if (!addr) return null;
                      return (
                        <>
                          <Text style={styles.summaryValue}>{addr.label}</Text>
                          <Text style={styles.summarySubtext}>{addr.street_address}</Text>
                        </>
                      );
                    })()}
                  </View>
                </View>
              )}

              {selectedAddonIds.length > 0 && (
                <View style={styles.summarySection}>
                  <View style={styles.summaryIconContainer}>
                    <Ionicons name="add-circle" size={16} color="#10B981" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.summaryLabel}>Add-ons ({selectedAddonIds.length})</Text>
                    {selectedAddonIds.map((addonId) => {
                      const addon = addons.find((a) => a.id === addonId);
                      if (!addon) return null;
                      return (
                        <Text key={addon.id} style={styles.summaryValue}>
                          • {addon.name}
                        </Text>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>

            {/* Pricing */}
            <View style={styles.pricingCard}>
              <Text style={styles.pricingTitle}>Payment Summary</Text>
              
              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>Service</Text>
                <Text style={styles.pricingValue}>QAR {pricing.servicePrice.toFixed(0)}</Text>
              </View>

              {pricing.addonsPrice > 0 && (
                <View style={styles.pricingRow}>
                  <Text style={styles.pricingLabel}>Add-ons</Text>
                  <Text style={styles.pricingValue}>QAR {pricing.addonsPrice.toFixed(0)}</Text>
                </View>
              )}

              <View style={styles.pricingDivider} />

              <View style={styles.pricingTotalRow}>
                <Text style={styles.pricingTotalLabel}>Total</Text>
                <Text style={styles.pricingTotal}>QAR {pricing.subtotal.toFixed(0)}</Text>
              </View>

              <View style={styles.paymentMethod}>
                <Ionicons name="cash" size={18} color="#10B981" />
                <Text style={styles.paymentMethodText}>Cash on service</Text>
              </View>
            </View>

            {/* Notes */}
            <View style={styles.notesSection}>
              <Text style={styles.notesLabel}>Special instructions (Optional)</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="Add any special requests or instructions..."
                placeholderTextColor={COLORS.text.light}
                value={customerNotes}
                onChangeText={setCustomerNotes}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Fixed Bottom Button */}
      <SafeAreaView style={styles.bottomSafe}>
        <View style={styles.bottomContainer}>
          {currentStep !== 'datetime' && (
            <TouchableOpacity
              style={styles.backButton2}
              onPress={goToPreviousStep}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={20} color={COLORS.text.primary} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.continueButton, currentStep === 'datetime' && { flex: 1 }]}
            onPress={currentStep === 'review' ? handleSubmit : goToNextStep}
            disabled={submitting}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={submitting ? ['#9CA3AF', '#6B7280'] : [COLORS.primary, COLORS.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.continueGradient}
            >
              {submitting ? (
                <>
                  <ActivityIndicator size="small" color="#FFF" />
                  <Text style={styles.continueText}>Processing...</Text>
                </>
              ) : (
                <>
                  <Text style={styles.continueText}>
                    {currentStep === 'review' ? 'Book Now' : 'Continue'}
                  </Text>
                  <Ionicons 
                    name={currentStep === 'review' ? 'checkmark' : 'arrow-forward'} 
                    size={20} 
                    color="#FFF" 
                  />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  stepIndicator: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  stepIndicatorText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text.primary,
  },

  // Step Pills
  stepPillsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 10,
  },
  stepPillWrapper: {
    marginRight: 10,
  },
  stepPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    gap: 8,
    backgroundColor: '#F3F4F6',
  },
  stepPillCompleted: {
    backgroundColor: '#F0FDF4',
  },
  stepPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },
  stepPillTextActive: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stepPillTextCompleted: {
    color: COLORS.success,
  },

  // Content
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Platform.OS === 'ios' ? 140 : 120,
  },
  stepContent: {
    padding: 20,
  },
  questionText: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 24,
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  addNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  addNewText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },

  // Time Slots
  timeSlotsSection: {
    marginTop: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 12,
  },
  loadingSlots: {
    paddingVertical: 32,
    alignItems: 'center',
    gap: 8,
  },
  loadingSlotsText: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },

  // Info & Error Boxes
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 14,
    borderRadius: 12,
    gap: 10,
    marginTop: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.info,
    lineHeight: 18,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 14,
    borderRadius: 12,
    gap: 10,
    marginTop: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.danger,
  },

  // Duration
  durationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 14,
    borderRadius: 12,
    gap: 10,
    marginTop: 16,
  },
  durationText: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  durationValue: {
    fontWeight: '700',
    color: COLORS.text.primary,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
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
    marginBottom: 24,
  },
  emptyButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  emptyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 8,
  },
  emptyButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Address List
  addressList: {
    gap: 12,
  },
  addressCard: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 12,
  },
  addressCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#EFF6FF',
  },
  addressRadio: {
    paddingTop: 2,
  },
  radioSelected: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioUnselected: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#D1D5DB',
  },
  addressLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  addressLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  defaultBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  addressText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 20,
  },

  // Addons List
  addonsList: {
    gap: 12,
  },
  addonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 12,
  },
  addonCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#EFF6FF',
  },
  addonCheckbox: {
    paddingTop: 2,
  },
  checkboxSelected: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxUnselected: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
  },
  addonName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  addonDescription: {
    fontSize: 13,
    color: COLORS.text.secondary,
    lineHeight: 18,
  },
  addonPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
  },

  // Summary
  summaryCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    gap: 16,
  },
  summarySection: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text.secondary,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text.primary,
    lineHeight: 20,
  },
  summarySubtext: {
    fontSize: 13,
    color: COLORS.text.secondary,
    lineHeight: 18,
  },

  // Pricing
  pricingCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  pricingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 12,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  pricingLabel: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  pricingValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  pricingDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  pricingTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  pricingTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  pricingTotal: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  paymentMethodText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },

  // Notes
  notesSection: {
    marginBottom: 16,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 10,
  },
  notesInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: COLORS.text.primary,
    minHeight: 90,
    textAlignVertical: 'top',
  },

  // Bottom
bottomSafe: {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  backgroundColor: '#FFFFFF',
  borderTopWidth: 1,
  borderTopColor: '#F3F4F6',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: -4 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 10,
},
bottomContainer: {
  flexDirection: 'row',
  paddingHorizontal: 16,
  paddingTop: 16,
  paddingBottom: Platform.OS === 'ios' ? 60 : 80, // Increased to clear tab bar
  gap: 12,
},
backButton2: {
  width: 52,
  height: 52,
  borderRadius: 16,
  backgroundColor: '#F3F4F6',
  alignItems: 'center',
  justifyContent: 'center',
},
continueButton: {
  flex: 1,
  borderRadius: 16,
  overflow: 'hidden',
  shadowColor: COLORS.primary,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 8,
  elevation: 5,
},
continueGradient: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: 16,
  gap: 8,
},
continueText: {
  fontSize: 16,
  fontWeight: '700',
  color: '#FFFFFF',
},
});