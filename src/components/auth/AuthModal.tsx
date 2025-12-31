// src/components/auth/AuthModal.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TextInput,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../constants/colors';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

const IS_IOS = Platform.OS === 'ios';

export const AuthModal: React.FC<AuthModalProps> = ({
  visible,
  onClose,
  initialMode = 'login',
}) => {
  const { signIn, signUp } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [loading, setLoading] = useState(false);

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginErrors, setLoginErrors] = useState<{ email?: string; password?: string }>({});

  // Register state
  const [registerData, setRegisterData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registerErrors, setRegisterErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (visible) {
      setMode(initialMode);
    }
  }, [visible, initialMode]);

  const resetForm = () => {
    setLoginEmail('');
    setLoginPassword('');
    setShowLoginPassword(false);
    setLoginErrors({});
    setRegisterData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    });
    setShowRegisterPassword(false);
    setShowConfirmPassword(false);
    setRegisterErrors({});
  };

  const handleClose = () => {
    Keyboard.dismiss();
    resetForm();
    onClose();
  };

  const formatPhoneNumber = (text: string) => {
    const digits = text.replace(/\D/g, '');
    const limitedDigits = digits.slice(0, 8);
    if (limitedDigits.length > 0) {
      return limitedDigits.replace(/(\d{4})(\d{4})/, '$1 $2');
    }
    return limitedDigits;
  };

  const handlePhoneChange = (text: string) => {
    const formatted = formatPhoneNumber(text);
    setRegisterData({ ...registerData, phone: formatted });
    if (registerErrors.phone) {
      const { phone, ...rest } = registerErrors;
      setRegisterErrors(rest);
    }
  };

  const validateLogin = () => {
    const errors: { email?: string; password?: string } = {};
    if (!loginEmail) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(loginEmail)) errors.email = 'Email is invalid';
    if (!loginPassword) errors.password = 'Password is required';
    setLoginErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateRegister = () => {
    const errors: Record<string, string> = {};
    if (!registerData.firstName.trim()) errors.firstName = 'First name is required';
    if (!registerData.lastName.trim()) errors.lastName = 'Last name is required';
    if (!registerData.email) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(registerData.email)) errors.email = 'Email is invalid';

    const phoneDigits = registerData.phone.replace(/\D/g, '');
    if (!phoneDigits) errors.phone = 'Phone number is required';
    else if (phoneDigits.length !== 8) errors.phone = 'Phone number must be 8 digits';

    if (!registerData.password) errors.password = 'Password is required';
    else if (registerData.password.length < 6) errors.password = 'Minimum 6 characters';
    if (registerData.password !== registerData.confirmPassword)
      errors.confirmPassword = 'Passwords do not match';

    setRegisterErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async () => {
    Keyboard.dismiss();
    if (!validateLogin()) return;
    setLoading(true);
    try {
      await signIn(loginEmail, loginPassword);
      handleClose();
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    Keyboard.dismiss();
    if (!validateRegister()) return;
    setLoading(true);
    try {
      await signUp({
        email: registerData.email,
        password: registerData.password,
        first_name: registerData.firstName,
        last_name: registerData.lastName,
        phone: registerData.phone,
      });
      handleClose();
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (next: 'login' | 'register') => {
    Keyboard.dismiss();
    setMode(next);
    resetForm();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={IS_IOS ? 'padding' : 'height'}
        style={styles.container}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.overlay}>
            <View style={styles.bottomSheet}>
              {/* Handle Bar */}
              <View style={styles.handleContainer}>
                <View style={styles.handleBar} />
              </View>

              {/* Header */}
              <View style={styles.header}>
                <LinearGradient
                  colors={[COLORS.primary, COLORS.secondary]}
                  style={styles.logoIcon}
                >
                  <Ionicons name="briefcase" size={28} color="#FFF" />
                </LinearGradient>
                <Text style={styles.headerTitle}>Call To Clean</Text>
                <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                  <Ionicons name="close" size={28} color={COLORS.text.primary} />
                </TouchableOpacity>
              </View>

              {/* Welcome Text */}
              <Text style={styles.welcomeText}>
                {mode === 'login' ? 'Welcome back!' : 'Create your account'}
              </Text>

{/* Mode Toggle */}
<View style={styles.modeToggle}>
  <TouchableOpacity
    style={[styles.modeButton, mode === 'login' && styles.modeButtonActive]}
    onPress={() => switchMode('login')}
    activeOpacity={0.7}
  >
    {mode === 'login' ? (
      <LinearGradient
        colors={[COLORS.primary, COLORS.secondary]}
        style={styles.modeButtonGradient}
      >
        <Text style={styles.modeButtonTextActive}>Sign In</Text>
      </LinearGradient>
    ) : (
      <Text style={styles.modeButtonTextInactive}>Sign In</Text>
    )}
  </TouchableOpacity>

  <TouchableOpacity
    style={[styles.modeButton, mode === 'register' && styles.modeButtonActive]}
    onPress={() => switchMode('register')}
    activeOpacity={0.7}
  >
    {mode === 'register' ? (
      <LinearGradient
        colors={[COLORS.primary, COLORS.secondary]}
        style={styles.modeButtonGradient}
      >
        <Text style={styles.modeButtonTextActive}>Sign Up</Text>
      </LinearGradient>
    ) : (
      <Text style={styles.modeButtonTextInactive}>Sign Up</Text>
    )}
  </TouchableOpacity>
</View>

              {/* Scrollable Form */}
              <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {mode === 'login' ? (
                  <View style={styles.form}>
                    {/* Email */}
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Email Address</Text>
                      <View style={[styles.inputContainer, loginErrors.email && styles.inputContainerError]}>
                        <View style={styles.inputIcon}>
                          <Ionicons name="mail" size={18} color={COLORS.text.secondary} />
                        </View>
                        <TextInput
                          value={loginEmail}
                          onChangeText={(text) => {
                            setLoginEmail(text);
                            if (loginErrors.email) setLoginErrors({ ...loginErrors, email: undefined });
                          }}
                          placeholder="you@example.com"
                          placeholderTextColor={COLORS.text.light}
                          style={styles.input}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoCorrect={false}
                          returnKeyType="next"
                        />
                      </View>
                      {loginErrors.email && (
                        <View style={styles.errorContainer}>
                          <Ionicons name="alert-circle" size={14} color={COLORS.danger} />
                          <Text style={styles.errorText}>{loginErrors.email}</Text>
                        </View>
                      )}
                    </View>

                    {/* Password */}
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Password</Text>
                      <View style={[styles.inputContainer, loginErrors.password && styles.inputContainerError]}>
                        <View style={styles.inputIcon}>
                          <Ionicons name="lock-closed" size={18} color={COLORS.text.secondary} />
                        </View>
                        <TextInput
                          value={loginPassword}
                          onChangeText={(text) => {
                            setLoginPassword(text);
                            if (loginErrors.password) setLoginErrors({ ...loginErrors, password: undefined });
                          }}
                          placeholder="Enter your password"
                          placeholderTextColor={COLORS.text.light}
                          style={styles.input}
                          secureTextEntry={!showLoginPassword}
                          autoCapitalize="none"
                          returnKeyType="done"
                          onSubmitEditing={handleLogin}
                        />
                        <TouchableOpacity
                          onPress={() => setShowLoginPassword(!showLoginPassword)}
                          style={styles.passwordToggle}
                        >
                          <Ionicons
                            name={showLoginPassword ? 'eye-off' : 'eye'}
                            size={20}
                            color={COLORS.text.secondary}
                          />
                        </TouchableOpacity>
                      </View>
                      {loginErrors.password && (
                        <View style={styles.errorContainer}>
                          <Ionicons name="alert-circle" size={14} color={COLORS.danger} />
                          <Text style={styles.errorText}>{loginErrors.password}</Text>
                        </View>
                      )}
                    </View>

                    <TouchableOpacity style={styles.forgotPassword} onPress={() => Alert.alert('Forgot Password', 'Feature coming soon!')}>
                      <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                      onPress={handleLogin}
                      disabled={loading}
                    >
                      <LinearGradient
                        colors={loading ? ['#9CA3AF', '#6B7280'] : [COLORS.primary, COLORS.secondary]}
                        style={styles.submitButtonGradient}
                      >
                        {loading ? (
                          <>
                            <ActivityIndicator size="small" color="#FFF" />
                            <Text style={styles.submitButtonText}>Signing in...</Text>
                          </>
                        ) : (
                          <>
                            <Text style={styles.submitButtonText}>Sign In</Text>
                            <Ionicons name="arrow-forward" size={20} color="#FFF" />
                          </>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>

                    <Text style={styles.termsText}>
                      By continuing, you agree to our <Text style={styles.termsLink}>Terms</Text> and <Text style={styles.termsLink}>Privacy Policy</Text>
                    </Text>
                  </View>
                ) : (
                  <View style={styles.form}>
                    {/* Name Row */}
                    <View style={styles.nameRow}>
                      <View style={styles.nameInput}>
                        <Text style={styles.inputLabel}>First Name</Text>
                        <View style={[styles.inputContainer, registerErrors.firstName && styles.inputContainerError]}>
                          <View style={styles.inputIcon}>
                            <Ionicons name="person" size={18} color={COLORS.text.secondary} />
                          </View>
                          <TextInput
                            value={registerData.firstName}
                            onChangeText={(text) => {
                              setRegisterData({ ...registerData, firstName: text });
                              if (registerErrors.firstName) {
                                const { firstName, ...rest } = registerErrors;
                                setRegisterErrors(rest);
                              }
                            }}
                            placeholder="Michael"
                            placeholderTextColor={COLORS.text.light}
                            style={styles.input}
                            autoCapitalize="words"
                            returnKeyType="next"
                          />
                        </View>
                        {registerErrors.firstName && (
                          <View style={styles.errorContainer}>
                            <Ionicons name="alert-circle" size={14} color={COLORS.danger} />
                            <Text style={styles.errorText}>{registerErrors.firstName}</Text>
                          </View>
                        )}
                      </View>

                      <View style={styles.nameInput}>
                        <Text style={styles.inputLabel}>Last Name</Text>
                        <View style={[styles.inputContainer, registerErrors.lastName && styles.inputContainerError]}>
                          <View style={styles.inputIcon}>
                            <Ionicons name="person" size={18} color={COLORS.text.secondary} />
                          </View>
                          <TextInput
                            value={registerData.lastName}
                            onChangeText={(text) => {
                              setRegisterData({ ...registerData, lastName: text });
                              if (registerErrors.lastName) {
                                const { lastName, ...rest } = registerErrors;
                                setRegisterErrors(rest);
                              }
                            }}
                            placeholder="Smith"
                            placeholderTextColor={COLORS.text.light}
                            style={styles.input}
                            autoCapitalize="words"
                            returnKeyType="next"
                          />
                        </View>
                        {registerErrors.lastName && (
                          <View style={styles.errorContainer}>
                            <Ionicons name="alert-circle" size={14} color={COLORS.danger} />
                            <Text style={styles.errorText}>{registerErrors.lastName}</Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Email */}
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Email Address</Text>
                      <View style={[styles.inputContainer, registerErrors.email && styles.inputContainerError]}>
                        <View style={styles.inputIcon}>
                          <Ionicons name="mail" size={18} color={COLORS.text.secondary} />
                        </View>
                        <TextInput
                          value={registerData.email}
                          onChangeText={(text) => {
                            setRegisterData({ ...registerData, email: text });
                            if (registerErrors.email) {
                              const { email, ...rest } = registerErrors;
                              setRegisterErrors(rest);
                            }
                          }}
                          placeholder="you@example.com"
                          placeholderTextColor={COLORS.text.light}
                          style={styles.input}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoCorrect={false}
                          returnKeyType="next"
                        />
                      </View>
                      {registerErrors.email && (
                        <View style={styles.errorContainer}>
                          <Ionicons name="alert-circle" size={14} color={COLORS.danger} />
                          <Text style={styles.errorText}>{registerErrors.email}</Text>
                        </View>
                      )}
                    </View>

                    {/* Phone */}
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Phone Number *</Text>
                      <View style={[styles.inputContainer, registerErrors.phone && styles.inputContainerError]}>
                        <View style={styles.inputIcon}>
                          <Ionicons name="call" size={18} color={COLORS.text.secondary} />
                        </View>
                        <TextInput
                          value={registerData.phone}
                          onChangeText={handlePhoneChange}
                          placeholder="1234 5678"
                          placeholderTextColor={COLORS.text.light}
                          style={styles.input}
                          keyboardType="phone-pad"
                          returnKeyType="next"
                          maxLength={9}
                        />
                      </View>
                      {registerErrors.phone ? (
                        <View style={styles.errorContainer}>
                          <Ionicons name="alert-circle" size={14} color={COLORS.danger} />
                          <Text style={styles.errorText}>{registerErrors.phone}</Text>
                        </View>
                      ) : (
                        <Text style={styles.phoneHelperText}>Enter 8-digit Qatari phone number</Text>
                      )}
                    </View>

                    {/* Password */}
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Password</Text>
                      <View style={[styles.inputContainer, registerErrors.password && styles.inputContainerError]}>
                        <View style={styles.inputIcon}>
                          <Ionicons name="lock-closed" size={18} color={COLORS.text.secondary} />
                        </View>
                        <TextInput
                          value={registerData.password}
                          onChangeText={(text) => {
                            setRegisterData({ ...registerData, password: text });
                            if (registerErrors.password) {
                              const { password, ...rest } = registerErrors;
                              setRegisterErrors(rest);
                            }
                          }}
                          placeholder="Create a password"
                          placeholderTextColor={COLORS.text.light}
                          style={styles.input}
                          secureTextEntry={!showRegisterPassword}
                          autoCapitalize="none"
                          returnKeyType="next"
                        />
                        <TouchableOpacity
                          onPress={() => setShowRegisterPassword(!showRegisterPassword)}
                          style={styles.passwordToggle}
                        >
                          <Ionicons
                            name={showRegisterPassword ? 'eye-off' : 'eye'}
                            size={20}
                            color={COLORS.text.secondary}
                          />
                        </TouchableOpacity>
                      </View>
                      {registerErrors.password && (
                        <View style={styles.errorContainer}>
                          <Ionicons name="alert-circle" size={14} color={COLORS.danger} />
                          <Text style={styles.errorText}>{registerErrors.password}</Text>
                        </View>
                      )}
                    </View>

                    {/* Confirm Password */}
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Confirm Password</Text>
                      <View style={[styles.inputContainer, registerErrors.confirmPassword && styles.inputContainerError]}>
                        <View style={styles.inputIcon}>
                          <Ionicons name="lock-closed" size={18} color={COLORS.text.secondary} />
                        </View>
                        <TextInput
                          value={registerData.confirmPassword}
                          onChangeText={(text) => {
                            setRegisterData({ ...registerData, confirmPassword: text });
                            if (registerErrors.confirmPassword) {
                              const { confirmPassword, ...rest } = registerErrors;
                              setRegisterErrors(rest);
                            }
                          }}
                          placeholder="Re-enter password"
                          placeholderTextColor={COLORS.text.light}
                          style={styles.input}
                          secureTextEntry={!showConfirmPassword}
                          autoCapitalize="none"
                          returnKeyType="done"
                          onSubmitEditing={handleRegister}
                        />
                        <TouchableOpacity
                          onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                          style={styles.passwordToggle}
                        >
                          <Ionicons
                            name={showConfirmPassword ? 'eye-off' : 'eye'}
                            size={20}
                            color={COLORS.text.secondary}
                          />
                        </TouchableOpacity>
                      </View>
                      {registerErrors.confirmPassword && (
                        <View style={styles.errorContainer}>
                          <Ionicons name="alert-circle" size={14} color={COLORS.danger} />
                          <Text style={styles.errorText}>{registerErrors.confirmPassword}</Text>
                        </View>
                      )}
                    </View>

                    <TouchableOpacity
                      style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                      onPress={handleRegister}
                      disabled={loading}
                    >
                      <LinearGradient
                        colors={loading ? ['#9CA3AF', '#6B7280'] : [COLORS.primary, COLORS.secondary]}
                        style={styles.submitButtonGradient}
                      >
                        {loading ? (
                          <>
                            <ActivityIndicator size="small" color="#FFF" />
                            <Text style={styles.submitButtonText}>Creating account...</Text>
                          </>
                        ) : (
                          <>
                            <Text style={styles.submitButtonText}>Create Account</Text>
                            <Ionicons name="arrow-forward" size={20} color="#FFF" />
                          </>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>

                    <Text style={styles.termsText}>
                      By creating an account, you agree to our <Text style={styles.termsLink}>Terms</Text> and <Text style={styles.termsLink}>Privacy Policy</Text>
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    height: '95%', // Tall modal – almost full screen
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  logoIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text.primary,
    flex: 1,
    marginLeft: 16,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: '#F9FAFB',
  },
  welcomeText: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.text.primary,
    textAlign: 'center',
    marginHorizontal: 20,
    marginVertical: 16,
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 4,
    marginHorizontal: 20,
    marginBottom: 24,
    gap: 4,
  },
  modeButton: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  modeButtonActive: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  modeButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },
  modeButtonTextActive: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modeButtonTextInactive: {
  fontSize: 16,
  fontWeight: '600',
  color: COLORS.text.secondary,
  textAlign: 'center',
  paddingVertical: 14,
},
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  form: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  nameInput: {
    flex: 1,
  },
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
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
  phoneHelperText: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginTop: 6,
    marginLeft: 4,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
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
});