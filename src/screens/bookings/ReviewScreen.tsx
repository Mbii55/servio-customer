// src/screens/bookings/ReviewScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES } from '../../constants/colors';
import api from '../../services/api';

type RouteParams = {
  bookingId: string;
  bookingNumber: string;
  serviceTitle: string;
  providerName: string;
};

export const ReviewScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const params = route.params as RouteParams;

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [canReview, setCanReview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkIfCanReview();
  }, []);

  const checkIfCanReview = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/reviews/can-review/${params.bookingId}`);
      setCanReview(!!response.data.canReview);

      if (!response.data.canReview) {
        setError('You have already reviewed this booking or it is not eligible for review.');
      }
    } catch (err: any) {
      console.error('Error checking review eligibility:', err);
      setError(err?.response?.data?.error || 'Failed to check review eligibility');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a rating before submitting');
      return;
    }

    if (comment.trim().length === 0) {
      Alert.alert('Comment Required', 'Please write a comment about your experience');
      return;
    }

    if (comment.trim().length < 10) {
      Alert.alert('Comment Too Short', 'Please write at least 10 characters');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/reviews', {
        booking_id: params.bookingId,
        rating,
        comment: comment.trim(),
      });

      Alert.alert('Review Submitted', 'Thank you for your feedback!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      console.error('Error submitting review:', err);
      Alert.alert('Error', err?.response?.data?.error || 'Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStar = (index: number) => {
    const filled = index < rating;
    return (
      <TouchableOpacity
        key={index}
        onPress={() => setRating(index + 1)}
        activeOpacity={0.7}
        style={styles.starButton}
      >
        <Ionicons name={filled ? 'star' : 'star-outline'} size={48} color={filled ? '#F59E0B' : '#D1D5DB'} />
      </TouchableOpacity>
    );
  };

  const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Write Review</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Checking eligibility...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !canReview) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Write Review</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.errorContainer}>
          <LinearGradient colors={['#FEF2F2', '#FEE2E2']} style={styles.errorIconContainer}>
            <Ionicons name="alert-circle" size={64} color="#EF4444" />
          </LinearGradient>

          <Text style={styles.errorTitle}>Cannot Review</Text>
          <Text style={styles.errorText}>{error}</Text>

          <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>Go Back</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Write Review</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Booking Info Card */}
          <View style={styles.bookingCard}>
            <LinearGradient colors={['#EFF6FF', '#DBEAFE']} style={styles.bookingCardGradient}>
              <View style={styles.bookingIconContainer}>
                <Ionicons name="checkmark-circle" size={32} color="#10B981" />
              </View>

              <View style={styles.bookingInfo}>
                <Text style={styles.bookingTitle}>{params.serviceTitle}</Text>
                <View style={styles.bookingMetaRow}>
                  <Ionicons name="business" size={14} color={COLORS.text.secondary} />
                  <Text style={styles.bookingMeta}>{params.providerName}</Text>
                </View>
                <View style={styles.bookingMetaRow}>
                  <Ionicons name="receipt" size={14} color={COLORS.text.secondary} />
                  <Text style={styles.bookingMeta}>#{params.bookingNumber}</Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Rating Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How was your experience?</Text>
            <Text style={styles.sectionSubtitle}>Rate your experience with this service</Text>

            <View style={styles.starsContainer}>{[0, 1, 2, 3, 4].map(renderStar)}</View>

            {rating > 0 && (
              <View style={styles.ratingLabelContainer}>
                <LinearGradient
                  colors={['#F59E0B', '#D97706']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.ratingLabelGradient}
                >
                  <Ionicons name="star" size={16} color="#FFF" />
                  <Text style={styles.ratingLabel}>{ratingLabels[rating]}</Text>
                </LinearGradient>
              </View>
            )}
          </View>

          {/* Comment Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Share your thoughts</Text>
            <Text style={styles.sectionSubtitle}>Tell us about your experience (minimum 10 characters)</Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textArea}
                placeholder="What did you like? What could be improved?"
                placeholderTextColor={COLORS.text.secondary}
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={6}
                maxLength={500}
                textAlignVertical="top"
              />
              <View style={styles.characterCount}>
                <Text style={styles.characterCountText}>{comment.length} / 500</Text>
              </View>
            </View>

            {/* Tips */}
            <View style={styles.tipsContainer}>
              <View style={styles.tipRow}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={styles.tipText}>Be specific about what you liked</Text>
              </View>
              <View style={styles.tipRow}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={styles.tipText}>Mention the quality of service</Text>
              </View>
              <View style={styles.tipRow}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={styles.tipText}>Be honest and constructive</Text>
              </View>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              (submitting || rating === 0 || comment.trim().length < 10) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            activeOpacity={0.8}
            disabled={submitting || rating === 0 || comment.trim().length < 10}
          >
            <LinearGradient
              colors={
                submitting || rating === 0 || comment.trim().length < 10
                  ? ['#D1D5DB', '#9CA3AF']
                  : [COLORS.primary, COLORS.secondary]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              {submitting ? (
                <>
                  <ActivityIndicator size="small" color="#FFF" />
                  <Text style={styles.submitButtonText}>Submitting...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="send" size={20} color="#FFF" />
                  <Text style={styles.submitButtonText}>Submit Review</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.padding,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  scrollContent: {
    padding: SIZES.padding,
    paddingBottom: 40,
  },
  
  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: COLORS.text.secondary,
  },

  // Error
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  errorIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#EF4444',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
  },

  // Booking Card
  bookingCard: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  bookingCardGradient: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookingIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  bookingInfo: {
    flex: 1,
  },
  bookingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  bookingMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  bookingMeta: {
    fontSize: 13,
    color: COLORS.text.secondary,
    marginLeft: 6,
  },

  // Sections
  section: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 20,
  },

  // Stars
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  starButton: {
    padding: 8,
  },
  ratingLabelContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  ratingLabelGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },

  // Input
  inputContainer: {
    position: 'relative',
  },
  textArea: {
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: COLORS.text.primary,
    minHeight: 120,
  },
  characterCount: {
    position: 'absolute',
    bottom: 12,
    right: 12,
  },
  characterCountText: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },

  // Tips
  tipsContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    gap: 8,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tipText: {
    fontSize: 13,
    color: '#065F46',
  },

  // Buttons
  primaryButton: {
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  submitButtonDisabled: {
    ...Platform.select({
      ios: {
        shadowColor: '#9CA3AF',
        shadowOpacity: 0.2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
});