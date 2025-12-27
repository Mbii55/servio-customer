// src/screens/auth/RegisterScreen.tsx
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SIZES } from '../../constants/colors';

type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

type RegisterScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

export const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const { signUp } = useAuth();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';

    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';

    if (formData.phone && !/^\+?[\d\s-()]+$/.test(formData.phone)) {
      newErrors.phone = 'Phone number is invalid';
    }

    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Use uppercase, lowercase, and a number';
    }

    if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await signUp({
        email: formData.email,
        password: formData.password,
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone || undefined,
      });
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const passwordRules = useMemo(() => {
    const pwd = formData.password;
    return [
      { label: 'At least 6 characters', met: pwd.length >= 6 },
      { label: 'One uppercase letter', met: /[A-Z]/.test(pwd) },
      { label: 'One lowercase letter', met: /[a-z]/.test(pwd) },
      { label: 'One number', met: /\d/.test(pwd) },
    ];
  }, [formData.password]);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.logoContainer}
            >
              <Ionicons name="briefcase" size={32} color="#FFF" />
            </LinearGradient>
            <Text style={styles.brandName}>Servio</Text>
            <Text style={styles.welcomeText}>Create your account</Text>
            <Text style={styles.subtitleText}>
              Join us to book trusted services and manage your orders
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formSection}>
            {/* Name Row */}
            <View style={styles.nameRow}>
              <View style={styles.nameInput}>
                <Text style={styles.inputLabel}>First Name</Text>
                <View style={[styles.inputContainer, errors.firstName && styles.inputContainerError]}>
                  <View style={styles.inputIcon}>
                    <Ionicons name="person" size={18} color={COLORS.text.secondary} />
                  </View>
                  <TextInput
                    value={formData.firstName}
                    onChangeText={(text) => updateField('firstName', text)}
                    placeholder="Michael"
                    placeholderTextColor={COLORS.text.light}
                    style={styles.input}
                    autoCapitalize="words"
                  />
                </View>
                {errors.firstName && (
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={14} color={COLORS.danger} />
                    <Text style={styles.errorText}>{errors.firstName}</Text>
                  </View>
                )}
              </View>

              <View style={styles.nameInput}>
                <Text style={styles.inputLabel}>Last Name</Text>
                <View style={[styles.inputContainer, errors.lastName && styles.inputContainerError]}>
                  <View style={styles.inputIcon}>
                    <Ionicons name="person" size={18} color={COLORS.text.secondary} />
                  </View>
                  <TextInput
                    value={formData.lastName}
                    onChangeText={(text) => updateField('lastName', text)}
                    placeholder="Smith"
                    placeholderTextColor={COLORS.text.light}
                    style={styles.input}
                    autoCapitalize="words"
                  />
                </View>
                {errors.lastName && (
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={14} color={COLORS.danger} />
                    <Text style={styles.errorText}>{errors.lastName}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <View style={[styles.inputContainer, errors.email && styles.inputContainerError]}>
                <View style={styles.inputIcon}>
                  <Ionicons name="mail" size={18} color={COLORS.text.secondary} />
                </View>
                <TextInput
                  value={formData.email}
                  onChangeText={(text) => updateField('email', text)}
                  placeholder="you@example.com"
                  placeholderTextColor={COLORS.text.light}
                  style={styles.input}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              {errors.email && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={14} color={COLORS.danger} />
                  <Text style={styles.errorText}>{errors.email}</Text>
                </View>
              )}
            </View>

            {/* Phone */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number (Optional)</Text>
              <View style={[styles.inputContainer, errors.phone && styles.inputContainerError]}>
                <View style={styles.inputIcon}>
                  <Ionicons name="call" size={18} color={COLORS.text.secondary} />
                </View>
                <TextInput
                  value={formData.phone}
                  onChangeText={(text) => updateField('phone', text)}
                  placeholder="+974 1234 5678"
                  placeholderTextColor={COLORS.text.light}
                  style={styles.input}
                  keyboardType="phone-pad"
                />
              </View>
              {errors.phone && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={14} color={COLORS.danger} />
                  <Text style={styles.errorText}>{errors.phone}</Text>
                </View>
              )}
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={[styles.inputContainer, errors.password && styles.inputContainerError]}>
                <View style={styles.inputIcon}>
                  <Ionicons name="lock-closed" size={18} color={COLORS.text.secondary} />
                </View>
                <TextInput
                  value={formData.password}
                  onChangeText={(text) => updateField('password', text)}
                  placeholder="Create a password"
                  placeholderTextColor={COLORS.text.light}
                  style={styles.input}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.passwordToggle}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={COLORS.text.secondary}
                  />
                </TouchableOpacity>
              </View>
              {errors.password && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={14} color={COLORS.danger} />
                  <Text style={styles.errorText}>{errors.password}</Text>
                </View>
              )}
            </View>

            {/* Confirm Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <View style={[styles.inputContainer, errors.confirmPassword && styles.inputContainerError]}>
                <View style={styles.inputIcon}>
                  <Ionicons name="lock-closed" size={18} color={COLORS.text.secondary} />
                </View>
                <TextInput
                  value={formData.confirmPassword}
                  onChangeText={(text) => updateField('confirmPassword', text)}
                  placeholder="Re-enter password"
                  placeholderTextColor={COLORS.text.light}
                  style={styles.input}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.passwordToggle}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={COLORS.text.secondary}
                  />
                </TouchableOpacity>
              </View>
              {errors.confirmPassword && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={14} color={COLORS.danger} />
                  <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                </View>
              )}
            </View>

            {/* Password Requirements */}
            {formData.password && (
              <View style={styles.passwordRules}>
                <Text style={styles.passwordRulesTitle}>Password Requirements</Text>
                {passwordRules.map((rule, index) => (
                  <View key={index} style={styles.ruleRow}>
                    <View style={[styles.ruleIcon, rule.met && styles.ruleIconMet]}>
                      {rule.met ? (
                        <Ionicons name="checkmark" size={12} color="#FFF" />
                      ) : (
                        <View style={styles.ruleIconEmpty} />
                      )}
                    </View>
                    <Text style={[styles.ruleText, rule.met && styles.ruleTextMet]}>
                      {rule.label}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Register Button */}
            <TouchableOpacity
              style={[styles.registerButton, loading && styles.registerButtonDisabled]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={loading ? ['#9CA3AF', '#6B7280'] : [COLORS.primary, COLORS.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.registerButtonGradient}
              >
                {loading ? (
                  <>
                    <Text style={styles.registerButtonText}>Creating account...</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.registerButtonText}>Create Account</Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFF" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Terms */}
            <Text style={styles.termsText}>
              By creating an account, you agree to our{' '}
              <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.loginPrompt}>
              <Text style={styles.loginText}>Already have an account?</Text>
              <TouchableOpacity 
                onPress={() => navigation.navigate('Login')} 
                activeOpacity={0.7}
              >
                <Text style={styles.loginLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
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

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 20 : 40,
    paddingBottom: 40,
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  brandName: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 15,
    color: COLORS.text.secondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },

  // Form Section
  formSection: {
    marginBottom: 32,
  },

  // Name Row
  nameRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  nameInput: {
    flex: 1,
  },

  // Input Group
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 8,
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
  passwordToggle: {
    width: 44,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    marginLeft: 4,
  },
  errorText: {
    fontSize: 13,
    color: COLORS.danger,
  },

  // Password Rules
  passwordRules: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  passwordRulesTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 12,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  ruleIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ruleIconMet: {
    backgroundColor: '#10B981',
  },
  ruleIconEmpty: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#9CA3AF',
  },
  ruleText: {
    fontSize: 13,
    color: COLORS.text.secondary,
  },
  ruleTextMet: {
    color: COLORS.text.primary,
    fontWeight: '600',
  },

  // Register Button
  registerButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  registerButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  registerButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Terms
  termsText: {
    fontSize: 12,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: COLORS.primary,
    fontWeight: '600',
  },

  // Footer
  footer: {
    marginTop: 'auto',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    fontSize: 14,
    color: COLORS.text.light,
    fontWeight: '500',
  },
  loginPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  loginText: {
    fontSize: 15,
    color: COLORS.text.secondary,
  },
  loginLink: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },
});