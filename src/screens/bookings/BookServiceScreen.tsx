/// src/screens/booking/BookServiceScreen.tsx
import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { COLORS, SIZES } from '../../constants/colors';
import { useBooking } from '../../context/BookingContext';
import { getServiceById } from '../../services/services';
import { getMyAddresses } from '../../services/addresses';
import { createBooking } from '../../services/bookings';
import api from '../../services/api';
import { Service, ServiceAddon, Address } from '../../types';
import { CalendarPicker } from '../../components/booking/CalendarPicker';
import { TimeSlotPicker } from '../../components/booking/TimeSlotPicker';
import { Button } from '../../components/common/Button';

type Params = { serviceId: string };
type NavProp = NativeStackNavigationProp<any>;

type BookingStep = 'datetime' | 'address' | 'addons' | 'review';

type SlotUI = { time: string; available: boolean };

export const BookServiceScreen: React.FC = () => {
  const route = useRoute<RouteProp<Record<string, Params>, string>>();
  const navigation = useNavigation<NavProp>();
  const { serviceId } = route.params;

  const { bookingData, updateBookingData, resetBookingData } = useBooking();

  const [currentStep, setCurrentStep] = useState<BookingStep>('datetime');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [service, setService] = useState<Service | null>(null);
  const [addons, setAddons] = useState<ServiceAddon[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);

  // Form state
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimeStr, setSelectedTimeStr] = useState<string | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [customerNotes, setCustomerNotes] = useState('');

  // ✅ Availability slots state (NEW)
  const [timeSlots, setTimeSlots] = useState<SlotUI[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsMessage, setSlotsMessage] = useState<string>('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
    return () => {
      resetBookingData();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [serviceData, addonsData, addressesData] = await Promise.all([
        getServiceById(serviceId),
        loadAddons(serviceId),
        getMyAddresses(),
      ]);

      setService(serviceData);
      setAddons(addonsData);
      setAddresses(addressesData);

      const defaultAddr = addressesData.find((a) => a.is_default);
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.id);
      }

      updateBookingData({ serviceId });
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load booking information');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const loadAddons = async (serviceId: string): Promise<ServiceAddon[]> => {
    try {
      const response = await api.get(`/addons/service/${serviceId}`);
      return (response.data || []).filter((a: ServiceAddon) => a.is_active);
    } catch (error) {
      return [];
    }
  };

  // ✅ Helper: Build a day list in 30-min increments (08:00 → 20:00)
 const buildFullHalfHourDay = () => {
  const out: string[] = [];
  for (let hour = 8; hour <= 23; hour++) { // ✅ Changed from 20 to 23
    for (let minute = 0; minute < 60; minute += 30) {
      if (hour === 23 && minute > 30) continue; // ✅ Stop at 23:30
      out.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
    }
  }
  return out;
};

// ✅ Fetch provider slots for selected date from backend (NEW)
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

    // ✅ Just map backend slots directly - backend only returns available times
    const backendSlots = (res.data?.slots || []) as string[];
    const uiSlots: SlotUI[] = backendSlots.map((time) => ({
      time,
      available: true, // Backend only returns available slots
    }));

    setTimeSlots(uiSlots);

    if (uiSlots.length === 0) {
      setSlotsMessage(res.data?.message || 'No available slots on this date');
    }
  } catch (e: any) {
    console.error('❌ Error loading slots:', e);
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
      // ✅ Ensure time is actually available (NEW safety)
      const slot = timeSlots.find((s) => s.time === selectedTimeStr);
      if (slot && !slot.available) {
        newErrors.time = 'This time is not available. Please choose another slot.';
      }
      // If slots are loaded but selection is not in list, also block it:
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
    // ✅ FIX: Format date without timezone conversion
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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!service) {
    return (
      <View style={styles.center}>
        <Text>Service not found</Text>
      </View>
    );
  }

  const provider = (service as any).provider;
  const bp = provider?.business_profile;
  const shopName = bp?.business_name || `${provider?.first_name || ''} ${provider?.last_name || ''}`.trim();

  const minDate = new Date();
  minDate.setHours(0, 0, 0, 0);

  // ✅ Optional: match backend “30 days ahead” rule (NEW)
  const maxDate = new Date(minDate);
  maxDate.setDate(maxDate.getDate() + 30);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Service</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Progress Steps */}
      <View style={styles.progressContainer}>
        <StepIndicator
          step={1}
          label="Date & Time"
          active={currentStep === 'datetime'}
          completed={['address', 'addons', 'review'].includes(currentStep)}
        />
        <View style={styles.progressLine} />
        <StepIndicator
          step={2}
          label="Address"
          active={currentStep === 'address'}
          completed={['addons', 'review'].includes(currentStep)}
        />
        <View style={styles.progressLine} />
        <StepIndicator
          step={3}
          label="Add-ons"
          active={currentStep === 'addons'}
          completed={currentStep === 'review'}
        />
        <View style={styles.progressLine} />
        <StepIndicator step={4} label="Review" active={currentStep === 'review'} completed={false} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Service Info Card */}
        <View style={styles.serviceCard}>
          <Text style={styles.serviceTitle}>{service.title}</Text>
          <Text style={styles.serviceMeta}>by {shopName}</Text>
          <Text style={styles.servicePrice}>QAR {Number(service.base_price).toFixed(2)}</Text>
        </View>

        {/* Step 1: Date & Time */}
        {currentStep === 'datetime' && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>When do you need this service?</Text>

            <CalendarPicker
              selectedDate={selectedDate}
              onDateSelect={(date) => {
                setSelectedDate(date);

                // ✅ NEW: fetch availability for this date
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

            {errors.date && <Text style={styles.errorText}>{errors.date}</Text>}

            {selectedDate && (
              <View style={{ marginTop: 20 }}>
                {slotsLoading ? (
                  <View style={{ paddingVertical: 16 }}>
                    <ActivityIndicator size="small" color={COLORS.primary} />
                    <Text style={{ marginTop: 8, color: COLORS.text.secondary }}>
                      Loading available times...
                    </Text>
                  </View>
                ) : (
                  <>
                    <TimeSlotPicker
                      selectedTime={selectedTimeStr}
                      onTimeSelect={(time) => {
                        // Optional extra safety: ignore taps on blocked slots
                        const slot = timeSlots.find((s) => s.time === time);
                        if (slot && !slot.available) return;

                        setSelectedTimeStr(time);
                        setErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors.time;
                          return newErrors;
                        });
                      }}
                      // ✅ NEW: pass computed slots so UI disables blocked times
                      timeSlots={timeSlots}
                    />

                    {!!slotsMessage && (
                      <Text style={{ marginTop: 10, color: COLORS.text.secondary }}>
                        {slotsMessage}
                      </Text>
                    )}
                  </>
                )}

                {errors.time && <Text style={styles.errorText}>{errors.time}</Text>}
              </View>
            )}

            {service.duration_minutes && (
              <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={20} color={COLORS.info} />
                <Text style={styles.infoText}>
                  Estimated duration: {service.duration_minutes} minutes
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Step 2: Address */}
        {currentStep === 'address' && (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <Text style={styles.stepTitle}>Where should we come?</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('AddAddress')}
                style={styles.addButton}
              >
                <Ionicons name="add-circle-outline" size={20} color={COLORS.primary} />
                <Text style={styles.addButtonText}>Add New</Text>
              </TouchableOpacity>
            </View>

            {addresses.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="location-outline" size={48} color={COLORS.text.light} />
                <Text style={styles.emptyText}>No addresses yet</Text>
                <Button
                  title="Add Address"
                  onPress={() => navigation.navigate('AddAddress')}
                  variant="primary"
                  style={{ marginTop: 16 }}
                />
              </View>
            ) : (
              <View style={styles.addressList}>
                {addresses.map((address) => (
                  <TouchableOpacity
                    key={address.id}
                    style={[
                      styles.addressCard,
                      selectedAddressId === address.id && styles.addressCardSelected,
                    ]}
                    onPress={() => setSelectedAddressId(address.id)}
                  >
                    <View style={styles.addressCardHeader}>
                      <View style={styles.addressCardLeft}>
                        <Ionicons
                          name={
                            selectedAddressId === address.id
                              ? 'radio-button-on'
                              : 'radio-button-off'
                          }
                          size={24}
                          color={
                            selectedAddressId === address.id ? COLORS.primary : COLORS.text.light
                          }
                        />
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
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
          </View>
        )}

        {/* Step 3: Add-ons */}
        {currentStep === 'addons' && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Add extra services (Optional)</Text>

            {addons.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="grid-outline" size={48} color={COLORS.text.light} />
                <Text style={styles.emptyText}>No add-ons available for this service</Text>
              </View>
            ) : (
              <View style={styles.addonsList}>
                {addons.map((addon) => (
                  <TouchableOpacity
                    key={addon.id}
                    style={[
                      styles.addonCard,
                      selectedAddonIds.includes(addon.id) && styles.addonCardSelected,
                    ]}
                    onPress={() => toggleAddon(addon.id)}
                  >
                    <View style={styles.addonCardLeft}>
                      <Ionicons
                        name={selectedAddonIds.includes(addon.id) ? 'checkbox' : 'square-outline'}
                        size={24}
                        color={
                          selectedAddonIds.includes(addon.id) ? COLORS.primary : COLORS.text.light
                        }
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.addonName}>{addon.name}</Text>
                        {addon.description && <Text style={styles.addonDesc}>{addon.description}</Text>}
                      </View>
                    </View>
                    <Text style={styles.addonPrice}>+QAR {Number(addon.price).toFixed(2)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Step 4: Review */}
        {currentStep === 'review' && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Review Your Booking</Text>

            {/* Date & Time Summary */}
            <View style={styles.summarySection}>
              <Text style={styles.summarySectionTitle}>Date & Time</Text>
              <View style={styles.summaryRow}>
                <Ionicons name="calendar-outline" size={20} color={COLORS.text.secondary} />
                <Text style={styles.summaryText}>
                  {selectedDate?.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Ionicons name="time-outline" size={20} color={COLORS.text.secondary} />
                <Text style={styles.summaryText}>
                  {selectedTimeStr && formatTime(selectedTimeStr)}
                </Text>
              </View>
            </View>

            {/* Address Summary */}
            {selectedAddressId && (
              <View style={styles.summarySection}>
                <Text style={styles.summarySectionTitle}>Service Address</Text>
                {(() => {
                  const addr = addresses.find((a) => a.id === selectedAddressId);
                  if (!addr) return null;
                  return (
                    <>
                      <Text style={styles.summaryText}>{addr.label}</Text>
                      <Text style={styles.summarySubtext}>{addr.street_address}</Text>
                      <Text style={styles.summarySubtext}>
                        {addr.city}, {addr.country}
                      </Text>
                    </>
                  );
                })()}
              </View>
            )}

            {/* Add-ons Summary */}
            {selectedAddonIds.length > 0 && (
              <View style={styles.summarySection}>
                <Text style={styles.summarySectionTitle}>Selected Add-ons</Text>
                {selectedAddonIds.map((addonId) => {
                  const addon = addons.find((a) => a.id === addonId);
                  if (!addon) return null;
                  return (
                    <View key={addon.id} style={styles.summaryAddonRow}>
                      <Text style={styles.summaryText}>{addon.name}</Text>
                      <Text style={styles.summaryPrice}>+QAR {Number(addon.price).toFixed(2)}</Text>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Pricing Summary */}
            <View style={styles.pricingCard}>
              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>Service Price</Text>
                <Text style={styles.pricingValue}>QAR {pricing.servicePrice.toFixed(2)}</Text>
              </View>
              {pricing.addonsPrice > 0 && (
                <View style={styles.pricingRow}>
                  <Text style={styles.pricingLabel}>Add-ons</Text>
                  <Text style={styles.pricingValue}>QAR {pricing.addonsPrice.toFixed(2)}</Text>
                </View>
              )}
              <View style={styles.pricingDivider} />
              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabelTotal}>Total</Text>
                <Text style={styles.pricingValueTotal}>QAR {pricing.subtotal.toFixed(2)}</Text>
              </View>
            </View>

            {/* Customer Notes */}
            <View style={styles.notesSection}>
              <Text style={styles.notesLabel}>Additional Notes (Optional)</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="Any special instructions or requirements..."
                placeholderTextColor={COLORS.text.light}
                value={customerNotes}
                onChangeText={setCustomerNotes}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Payment Method */}
            <View style={styles.paymentSection}>
              <Text style={styles.paymentLabel}>Payment Method</Text>
              <View style={styles.paymentCard}>
                <Ionicons name="cash-outline" size={24} color={COLORS.success} />
                <Text style={styles.paymentText}>Cash on Service</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomBar}>
        {currentStep !== 'datetime' && (
          <Button
            title="Back"
            onPress={goToPreviousStep}
            variant="outline"
            style={styles.bottomButton}
          />
        )}
        {currentStep !== 'review' ? (
          <Button
            title="Continue"
            onPress={goToNextStep}
            variant="primary"
            style={styles.bottomButton}
          />
        ) : (
          <Button
            title="Confirm Booking"
            onPress={handleSubmit}
            loading={submitting}
            variant="primary"
            style={styles.bottomButton}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

interface StepIndicatorProps {
  step: number;
  label: string;
  active: boolean;
  completed: boolean;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ step, label, active, completed }) => {
  return (
    <View style={styles.stepIndicator}>
      <View
        style={[
          styles.stepCircle,
          active && styles.stepCircleActive,
          completed && styles.stepCircleCompleted,
        ]}
      >
        {completed ? (
          <Ionicons name="checkmark" size={16} color="#FFFFFF" />
        ) : (
          <Text style={[styles.stepNumber, (active || completed) && styles.stepNumberActive]}>
            {step}
          </Text>
        )}
      </View>
      <Text style={[styles.stepLabel, (active || completed) && styles.stepLabelActive]}>
        {label}
      </Text>
    </View>
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

  // Header
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

  // Progress
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
    paddingVertical: 20,
    backgroundColor: COLORS.background.primary,
  },
  stepIndicator: {
    alignItems: 'center',
    gap: 6,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.background.tertiary,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  stepCircleCompleted: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  stepNumber: {
    fontSize: SIZES.small,
    fontWeight: 'bold',
    color: COLORS.text.light,
  },
  stepNumberActive: {
    color: '#FFFFFF',
  },
  stepLabel: {
    fontSize: 10,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  stepLabelActive: {
    color: COLORS.text.primary,
    fontWeight: '600',
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: COLORS.border,
    marginHorizontal: 4,
  },

  // Content
  content: {
    flex: 1,
  },
  serviceCard: {
    backgroundColor: COLORS.background.primary,
    padding: SIZES.padding,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  serviceTitle: {
    fontSize: SIZES.body,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  serviceMeta: {
    fontSize: SIZES.small,
    color: COLORS.text.secondary,
    marginTop: 4,
  },
  servicePrice: {
    fontSize: SIZES.h4,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: 8,
  },

  // Steps
  stepContent: {
    padding: SIZES.padding,
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepTitle: {
    fontSize: SIZES.h4,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 20,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addButtonText: {
    fontSize: SIZES.small,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // Info Box
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.info + '15',
    padding: 12,
    borderRadius: SIZES.radius,
    gap: 8,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: SIZES.small,
    color: COLORS.info,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: SIZES.body,
    color: COLORS.text.secondary,
    marginTop: 12,
  },

  // Address List
  addressList: {
    gap: 12,
  },
  addressCard: {
    backgroundColor: COLORS.background.primary,
    padding: 16,
    borderRadius: SIZES.radius,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  addressCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '08',
  },
  addressCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  addressCardLeft: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
  },
  addressLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
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
  addressText: {
    fontSize: SIZES.small,
    color: COLORS.text.secondary,
    marginTop: 2,
  },

  // Add-ons List
  addonsList: {
    gap: 12,
  },
  addonCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.background.primary,
    padding: 16,
    borderRadius: SIZES.radius,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  addonCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '08',
  },
  addonCardLeft: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
  },
  addonName: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  addonDesc: {
    fontSize: SIZES.small,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  addonPrice: {
    fontSize: SIZES.body,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginLeft: 12,
  },

  // Review Summary
  summarySection: {
    backgroundColor: COLORS.background.primary,
    padding: 16,
    borderRadius: SIZES.radius,
    marginBottom: 12,
  },
  summarySectionTitle: {
    fontSize: SIZES.body,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  summaryText: {
    fontSize: SIZES.body,
    color: COLORS.text.primary,
  },
  summarySubtext: {
    fontSize: SIZES.small,
    color: COLORS.text.secondary,
    marginTop: 4,
  },
  summaryAddonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryPrice: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // Pricing
  pricingCard: {
    backgroundColor: COLORS.background.primary,
    padding: 16,
    borderRadius: SIZES.radius,
    marginBottom: 12,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  pricingLabel: {
    fontSize: SIZES.body,
    color: COLORS.text.secondary,
  },
  pricingValue: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  pricingDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 8,
  },
  pricingLabelTotal: {
    fontSize: SIZES.body,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  pricingValueTotal: {
    fontSize: SIZES.h4,
    fontWeight: 'bold',
    color: COLORS.primary,
  },

  // Notes
  notesSection: {
    marginBottom: 12,
  },
  notesLabel: {
    fontSize: SIZES.small,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  notesInput: {
    backgroundColor: COLORS.background.primary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radius,
    padding: 12,
    fontSize: SIZES.body,
    color: COLORS.text.primary,
    minHeight: 80,
  },

  // Payment
  paymentSection: {
    marginBottom: 12,
  },
  paymentLabel: {
    fontSize: SIZES.small,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.primary,
    padding: 16,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  paymentText: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.text.primary,
  },

  // Error
  errorText: {
    fontSize: SIZES.small,
    color: COLORS.danger,
    marginTop: 8,
  },

  // Bottom Bar
  bottomBar: {
    flexDirection: 'row',
    gap: 12,
    padding: SIZES.padding,
    backgroundColor: COLORS.background.primary,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  bottomButton: {
    flex: 1,
  },
});