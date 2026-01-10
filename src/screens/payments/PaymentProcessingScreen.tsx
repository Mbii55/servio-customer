// src/screens/payments/PaymentProcessingScreen.tsx
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { WebView } from 'react-native-webview';

import { COLORS } from '../../constants/colors';
import { useInitiatePayment, useValidatePayment } from '../../hooks/usePayments';

type Params = { 
  bookingData: {
    service_id: string;
    scheduled_date: string;
    scheduled_time: string;
    address_id?: string;
    addons?: { addon_id: string; quantity?: number }[];
    customer_notes?: string;
  };
  amount: number;
};
type NavProp = NativeStackNavigationProp<any>;

type PaymentStep = 'initiating' | 'payment' | 'validating' | 'success' | 'failed';

export const PaymentProcessingScreen: React.FC = () => {
  const route = useRoute<RouteProp<Record<string, Params>, string>>();
  const navigation = useNavigation<NavProp>();
  const { bookingData, amount } = route.params;

  const [currentStep, setCurrentStep] = useState<PaymentStep>('initiating');
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [transactionReference, setTransactionReference] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showWebView, setShowWebView] = useState(false);
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);

  const initiatePaymentMutation = useInitiatePayment();
  const validatePaymentMutation = useValidatePayment();

  const webViewRef = useRef<WebView>(null);
  const validationAttempted = useRef(false);

  // Step 1: Initiate payment on mount
  useEffect(() => {
    initiatePayment();
  }, []);

  const initiatePayment = async () => {
    try {
      setCurrentStep('initiating');
      setErrorMessage(null);

      const response = await initiatePaymentMutation.mutateAsync(bookingData);

      if (response.success && response.paymentUrl) {
        setPaymentUrl(response.paymentUrl);
        setTransactionReference(response.transactionReference);
        setCurrentStep('payment');
        
        // Open payment URL
        setTimeout(() => {
          setShowWebView(true);
        }, 500);
      } else {
        throw new Error(response.message || 'Failed to generate payment link');
      }
    } catch (error: any) {
      console.error('Payment initiation error:', error);
      setErrorMessage(error.message || 'Failed to initiate payment');
      setCurrentStep('failed');
    }
  };

  // Step 2: Handle WebView navigation (detect return from Noqoody)
  const handleWebViewNavigationStateChange = (navState: any) => {
    const { url } = navState;
    
    console.log('WebView navigation:', url);

    // Detect if user returned to app (success/cancel URLs)
    if (url.includes('servio://payment/success') || url.includes('/success')) {
      handlePaymentReturn('success');
    } else if (url.includes('servio://payment/cancel') || url.includes('/cancel')) {
      handlePaymentReturn('cancel');
    }
  };

  // Step 3: Validate payment after return (creates booking)
  const handlePaymentReturn = async (type: 'success' | 'cancel') => {
    if (validationAttempted.current) return;
    validationAttempted.current = true;

    setShowWebView(false);
    setCurrentStep('validating');

    if (type === 'cancel') {
      Alert.alert(
        'Payment Cancelled',
        'You cancelled the payment. No booking was created.',
        [
          {
            text: 'Try Again',
            onPress: () => {
              validationAttempted.current = false;
              initiatePayment();
            },
          },
          {
            text: 'Go Back',
            onPress: () => navigation.goBack(),
          },
        ]
      );
      return;
    }

    // Validate payment with backend
    if (!transactionReference) {
      setErrorMessage('Transaction reference missing');
      setCurrentStep('failed');
      return;
    }

    try {
      const result = await validatePaymentMutation.mutateAsync(transactionReference);

      if (result.success && result.status === 'completed' && result.bookingId) {
        // ✅ Booking was created successfully!
        setCreatedBookingId(result.bookingId);
        setCurrentStep('success');
        
        // Navigate to success screen after short delay
        setTimeout(() => {
          navigation.replace('BookingSuccess', { bookingId: result.bookingId });
        }, 2000);
      } else if (result.status === 'pending') {
        // Payment still processing
        Alert.alert(
          'Payment Processing',
          'Your payment is being processed. Please wait a moment...',
          [
            {
              text: 'Check Status',
              onPress: () => {
                validationAttempted.current = false;
                handlePaymentReturn('success');
              },
            },
          ]
        );
      } else {
        throw new Error(result.message || 'Payment validation failed');
      }
    } catch (error: any) {
      console.error('Payment validation error:', error);
      setErrorMessage(error.message || 'Failed to validate payment');
      setCurrentStep('failed');
    }
  };

  // Manual validation trigger (for user to check status)
  const handleManualValidation = () => {
    validationAttempted.current = false;
    handlePaymentReturn('success');
  };

  // Retry payment
  const handleRetry = () => {
    validationAttempted.current = false;
    setShowWebView(false);
    setCreatedBookingId(null);
    initiatePayment();
  };

  // Cancel and go back
  const handleCancel = () => {
    Alert.alert(
      'Cancel Payment?',
      'Are you sure you want to cancel? No booking will be created.',
      [
        { text: 'No, Continue', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  // Render different states
  if (showWebView && paymentUrl) {
    return (
      <SafeAreaView style={styles.container}>
        {/* WebView Header */}
        <View style={styles.webViewHeader}>
          <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={COLORS.text.primary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.webViewTitle}>Secure Payment</Text>
            <Text style={styles.webViewSubtitle}>Noqoody Payment Gateway</Text>
          </View>
          <View style={styles.secureIndicator}>
            <Ionicons name="shield-checkmark" size={16} color="#10B981" />
            <Text style={styles.secureText}>Secure</Text>
          </View>
        </View>

        {/* WebView */}
        <WebView
          ref={webViewRef}
          source={{ uri: paymentUrl }}
          onNavigationStateChange={handleWebViewNavigationStateChange}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.webViewLoading}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Loading payment page...</Text>
            </View>
          )}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error('WebView error:', nativeEvent);
            setErrorMessage('Failed to load payment page');
            setCurrentStep('failed');
            setShowWebView(false);
          }}
        />

        {/* Bottom Info */}
        <View style={styles.webViewFooter}>
          <View style={styles.amountContainer}>
            <Text style={styles.amountLabel}>Amount to Pay</Text>
            <Text style={styles.amountValue}>QAR {amount.toFixed(0)}</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Initiating Payment */}
        {currentStep === 'initiating' && (
          <View style={styles.centerContent}>
            <View style={styles.loadingIconContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
            <Text style={styles.title}>Initiating Payment</Text>
            <Text style={styles.subtitle}>Setting up secure payment gateway...</Text>
            <View style={styles.amountBox}>
              <Text style={styles.amountBoxLabel}>Amount</Text>
              <Text style={styles.amountBoxValue}>QAR {amount.toFixed(0)}</Text>
            </View>
          </View>
        )}

        {/* Payment In Progress */}
        {currentStep === 'payment' && !showWebView && (
          <View style={styles.centerContent}>
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={[COLORS.primary, COLORS.secondary]}
                style={styles.iconCircle}
              >
                <Ionicons name="card" size={48} color="#FFF" />
              </LinearGradient>
            </View>
            <Text style={styles.title}>Opening Payment Gateway</Text>
            <Text style={styles.subtitle}>Redirecting to secure payment page...</Text>
          </View>
        )}

        {/* Validating Payment */}
        {currentStep === 'validating' && (
          <View style={styles.centerContent}>
            <View style={styles.loadingIconContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
            <Text style={styles.title}>Validating Payment</Text>
            <Text style={styles.subtitle}>Please wait while we confirm your payment and create your booking...</Text>
            
            <TouchableOpacity
              style={styles.checkStatusButton}
              onPress={handleManualValidation}
              disabled={validatePaymentMutation.isPending}
            >
              <Text style={styles.checkStatusText}>Check Status Manually</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Payment Success */}
        {currentStep === 'success' && (
          <View style={styles.centerContent}>
            <View style={styles.successIconContainer}>
              <LinearGradient
                colors={['#10B981', '#059669']}
                style={styles.iconCircle}
              >
                <Ionicons name="checkmark" size={56} color="#FFF" />
              </LinearGradient>
            </View>
            <Text style={styles.successTitle}>Payment Successful!</Text>
            <Text style={styles.successSubtitle}>
              Your payment has been confirmed and booking created
            </Text>
            <View style={styles.amountBox}>
              <Text style={styles.amountBoxLabel}>Paid Amount</Text>
              <Text style={styles.amountBoxValue}>QAR {amount.toFixed(0)}</Text>
            </View>
            <Text style={styles.redirectText}>Redirecting to booking details...</Text>
          </View>
        )}

        {/* Payment Failed */}
        {currentStep === 'failed' && (
          <View style={styles.centerContent}>
            <View style={styles.errorIconContainer}>
              <LinearGradient
                colors={['#FEF2F2', '#FEE2E2']}
                style={styles.iconCircle}
              >
                <Ionicons name="close-circle" size={56} color={COLORS.danger} />
              </LinearGradient>
            </View>
            <Text style={styles.errorTitle}>Payment Failed</Text>
            <Text style={styles.errorSubtitle}>
              {errorMessage || 'Something went wrong with your payment'}
            </Text>

            <View style={styles.errorActions}>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={handleRetry}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[COLORS.primary, COLORS.secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.retryButtonGradient}
                >
                  <Ionicons name="refresh" size={20} color="#FFF" />
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => navigation.goBack()}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Back to Booking Form</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.helpBox}>
              <Ionicons name="information-circle" size={18} color={COLORS.info} />
              <Text style={styles.helpText}>
                No booking was created. You can try again or go back to modify your booking details.
              </Text>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  centerContent: {
    alignItems: 'center',
    width: '100%',
  },

  // Loading State
  loadingIconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 24,
  },

  // Icon Containers
  iconContainer: {
    marginBottom: 24,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successIconContainer: {
    marginBottom: 24,
  },
  errorIconContainer: {
    marginBottom: 24,
  },

  // Amount Box
  amountBox: {
    backgroundColor: COLORS.background.secondary,
    paddingHorizontal: 32,
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  amountBoxLabel: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 4,
  },
  amountBoxValue: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.text.primary,
  },

  // Success State
  successTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#10B981',
    textAlign: 'center',
    marginBottom: 12,
  },
  successSubtitle: {
    fontSize: 16,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  redirectText: {
    fontSize: 14,
    color: COLORS.text.light,
    fontStyle: 'italic',
    marginTop: 16,
  },

  // Failed State
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.danger,
    textAlign: 'center',
    marginBottom: 12,
  },
  errorSubtitle: {
    fontSize: 16,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 24,
  },
  errorActions: {
    width: '100%',
    gap: 12,
  },
  retryButton: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  retryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: COLORS.background.secondary,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  helpBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    gap: 12,
  },
  helpText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 20,
  },

  // Check Status Button
  checkStatusButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: COLORS.background.secondary,
    borderRadius: 8,
  },
  checkStatusText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // WebView Styles
  webViewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  closeButton: {
    padding: 4,
    marginRight: 12,
  },
  webViewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  webViewSubtitle: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  secureIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  secureText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  webViewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background.primary,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  webViewFooter: {
    backgroundColor: COLORS.background.secondary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  amountLabel: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  amountValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
});