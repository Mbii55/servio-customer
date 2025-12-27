// src/components/auth/AuthModal.tsx
import React, { useEffect, useState, useRef } from 'react';
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
  Pressable,
  TextInput,
  ActivityIndicator,
  Dimensions,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SIZES } from '../../constants/colors';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const IS_IOS = Platform.OS === 'ios';

export const AuthModal: React.FC<AuthModalProps> = ({
  visible,
  onClose,
  initialMode = 'login',
}) => {
  const { signIn, signUp } = useAuth();
  
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const activeInputRef = useRef<TextInput>(null);

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
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setIsKeyboardVisible(true);
        setKeyboardHeight(e.endCoordinates.height);
        
        // Small delay to ensure the input is focused
        setTimeout(() => {
          if (activeInputRef.current) {
            activeInputRef.current.measureInWindow((x, y, width, height) => {
              const inputBottom = y + height;
              const keyboardTop = SCREEN_HEIGHT - e.endCoordinates.height;
              
              if (inputBottom > keyboardTop - 20) {
                const scrollToY = inputBottom - keyboardTop + 20;
                scrollViewRef.current?.scrollTo({ y: scrollToY, animated: true });
              }
            });
          }
        }, 100);
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setIsKeyboardVisible(false);
        setKeyboardHeight(0);
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

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

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const formatPhoneNumber = (text: string) => {
    // Remove all non-digit characters
    const digits = text.replace(/\D/g, '');
    
    // Limit to 8 digits
    const limitedDigits = digits.slice(0, 8);
    
    // Format as Qatari phone number (optional)
    if (limitedDigits.length > 0) {
      return limitedDigits.replace(/(\d{4})(\d{4})/, '$1 $2');
    }
    
    return limitedDigits;
  };

  const handlePhoneChange = (text: string) => {
    const formatted = formatPhoneNumber(text);
    setRegisterData({ ...registerData, phone: formatted });
    
    // Clear phone error if user starts typing
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

    // Phone validation - now required and must be exactly 8 digits
    const phoneDigits = registerData.phone.replace(/\D/g, '');
    if (!phoneDigits) {
      errors.phone = 'Phone number is required';
    } else if (phoneDigits.length !== 8) {
      errors.phone = 'Phone number must be 8 digits';
    }

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
        phone: registerData.phone, // Phone is now required
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
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
  };

  return (
    <Modal 
      visible={visible} 
      animationType="slide" 
      transparent 
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <View style={styles.modalOverlay}>
          {/* Backdrop */}
          <Pressable style={styles.backdrop} onPress={handleClose} />

          {/* Bottom Sheet */}
          <View style={[
            styles.bottomSheetContainer,
            isKeyboardVisible && styles.bottomSheetWithKeyboard
          ]}>
            <KeyboardAvoidingView
              behavior={IS_IOS ? 'padding' : 'height'}
              style={styles.keyboardView}
              keyboardVerticalOffset={IS_IOS ? 0 : -keyboardHeight}
            >
              <View style={[
                styles.modalSheet,
                { maxHeight: isKeyboardVisible ? SCREEN_HEIGHT * 0.95 : SCREEN_HEIGHT * 0.9 }
              ]}>
                {/* Handle Bar */}
                <TouchableOpacity 
                  style={styles.handleContainer}
                  onPress={dismissKeyboard}
                  activeOpacity={0.7}
                >
                  <View style={styles.handleBar} />
                </TouchableOpacity>

                {/* Header */}
                <View style={styles.header}>
                  <View style={styles.headerContent}>
                    <LinearGradient
                      colors={[COLORS.primary, COLORS.secondary]}
                      style={styles.logoIcon}
                    >
                      <Ionicons name="briefcase" size={24} color="#FFF" />
                    </LinearGradient>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.headerTitle}>Servio</Text>
                      <Text style={styles.headerSubtitle}>
                        {mode === 'login' ? 'Welcome back!' : 'Join us today'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={handleClose}
                      style={styles.closeButton}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="close" size={24} color={COLORS.text.primary} />
                    </TouchableOpacity>
                  </View>

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
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.modeButtonGradient}
                        >
                          <Text style={styles.modeButtonTextActive}>Sign In</Text>
                        </LinearGradient>
                      ) : (
                        <Text style={styles.modeButtonText}>Sign In</Text>
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
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.modeButtonGradient}
                        >
                          <Text style={styles.modeButtonTextActive}>Sign Up</Text>
                        </LinearGradient>
                      ) : (
                        <Text style={styles.modeButtonText}>Sign Up</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Form Content */}
                <ScrollView
                  ref={scrollViewRef}
                  style={styles.formScroll}
                  contentContainerStyle={[
                    styles.formContent,
                    { paddingBottom: isKeyboardVisible ? keyboardHeight + 20 : 32 }
                  ]}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  bounces={false}
                >
                  {mode === 'login' ? (
                    // Login Form
                    <View style={styles.form}>
                      {/* Email */}
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Email Address</Text>
                        <View style={[styles.inputContainer, loginErrors.email && styles.inputContainerError]}>
                          <View style={styles.inputIcon}>
                            <Ionicons name="mail" size={18} color={COLORS.text.secondary} />
                          </View>
                          <TextInput
                            ref={(ref) => { if (ref) activeInputRef.current = ref; }}
                            value={loginEmail}
                            onChangeText={(text) => {
                              setLoginEmail(text);
                              if (loginErrors.email) setLoginErrors({ ...loginErrors, email: undefined });
                            }}
                            onFocus={() => {
                              setTimeout(() => {
                                scrollViewRef.current?.scrollTo({ y: 0, animated: true });
                              }, 100);
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
                            ref={(ref) => { if (ref) activeInputRef.current = ref; }}
                            value={loginPassword}
                            onChangeText={(text) => {
                              setLoginPassword(text);
                              if (loginErrors.password) setLoginErrors({ ...loginErrors, password: undefined });
                            }}
                            onFocus={() => {
                              setTimeout(() => {
                                scrollViewRef.current?.scrollTo({ y: 60, animated: true });
                              }, 100);
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
                            activeOpacity={0.7}
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

                      {/* Forgot Password */}
                      <TouchableOpacity
                        style={styles.forgotPassword}
                        activeOpacity={0.7}
                        onPress={() => Alert.alert('Forgot Password', 'Feature coming soon!')}
                      >
                        <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                      </TouchableOpacity>

                      {/* Login Button */}
                      <TouchableOpacity
                        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                        onPress={handleLogin}
                        disabled={loading}
                        activeOpacity={0.8}
                      >
                        <LinearGradient
                          colors={loading ? ['#9CA3AF', '#6B7280'] : [COLORS.primary, COLORS.secondary]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
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

                      {/* Terms */}
                      <Text style={styles.termsText}>
                        By continuing, you agree to our{' '}
                        <Text style={styles.termsLink}>Terms</Text> and{' '}
                        <Text style={styles.termsLink}>Privacy Policy</Text>
                      </Text>
                    </View>
                  ) : (
                    // Register Form
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
                              ref={(ref) => { if (ref) activeInputRef.current = ref; }}
                              value={registerData.firstName}
                              onChangeText={(text) => {
                                setRegisterData({ ...registerData, firstName: text });
                                if (registerErrors.firstName) {
                                  const { firstName, ...rest } = registerErrors;
                                  setRegisterErrors(rest);
                                }
                              }}
                              onFocus={() => {
                                setTimeout(() => {
                                  scrollViewRef.current?.scrollTo({ y: 0, animated: true });
                                }, 100);
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
                              ref={(ref) => { if (ref) activeInputRef.current = ref; }}
                              value={registerData.lastName}
                              onChangeText={(text) => {
                                setRegisterData({ ...registerData, lastName: text });
                                if (registerErrors.lastName) {
                                  const { lastName, ...rest } = registerErrors;
                                  setRegisterErrors(rest);
                                }
                              }}
                              onFocus={() => {
                                setTimeout(() => {
                                  scrollViewRef.current?.scrollTo({ y: 0, animated: true });
                                }, 100);
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
                            ref={(ref) => { if (ref) activeInputRef.current = ref; }}
                            value={registerData.email}
                            onChangeText={(text) => {
                              setRegisterData({ ...registerData, email: text });
                              if (registerErrors.email) {
                                const { email, ...rest } = registerErrors;
                                setRegisterErrors(rest);
                              }
                            }}
                            onFocus={() => {
                              setTimeout(() => {
                                scrollViewRef.current?.scrollTo({ y: 80, animated: true });
                              }, 100);
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

                      {/* Phone - Now Required */}
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Phone Number *</Text>
                        <View style={[styles.inputContainer, registerErrors.phone && styles.inputContainerError]}>
                          <View style={styles.inputIcon}>
                            <Ionicons name="call" size={18} color={COLORS.text.secondary} />
                          </View>
                          <TextInput
                            ref={(ref) => { if (ref) activeInputRef.current = ref; }}
                            value={registerData.phone}
                            onChangeText={handlePhoneChange}
                            onFocus={() => {
                              setTimeout(() => {
                                scrollViewRef.current?.scrollTo({ y: 160, animated: true });
                              }, 100);
                            }}
                            placeholder="1234 5678"
                            placeholderTextColor={COLORS.text.light}
                            style={styles.input}
                            keyboardType="phone-pad"
                            returnKeyType="next"
                            maxLength={9} // 8 digits + 1 space
                          />
                        </View>
                        {registerErrors.phone ? (
                          <View style={styles.errorContainer}>
                            <Ionicons name="alert-circle" size={14} color={COLORS.danger} />
                            <Text style={styles.errorText}>{registerErrors.phone}</Text>
                          </View>
                        ) : (
                          <Text style={styles.phoneHelperText}>
                            Enter 8-digit Qatari phone number
                          </Text>
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
                            ref={(ref) => { if (ref) activeInputRef.current = ref; }}
                            value={registerData.password}
                            onChangeText={(text) => {
                              setRegisterData({ ...registerData, password: text });
                              if (registerErrors.password) {
                                const { password, ...rest } = registerErrors;
                                setRegisterErrors(rest);
                              }
                            }}
                            onFocus={() => {
                              setTimeout(() => {
                                scrollViewRef.current?.scrollTo({ y: 220, animated: true });
                              }, 100);
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
                            activeOpacity={0.7}
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
                            ref={(ref) => { if (ref) activeInputRef.current = ref; }}
                            value={registerData.confirmPassword}
                            onChangeText={(text) => {
                              setRegisterData({ ...registerData, confirmPassword: text });
                              if (registerErrors.confirmPassword) {
                                const { confirmPassword, ...rest } = registerErrors;
                                setRegisterErrors(rest);
                              }
                            }}
                            onFocus={() => {
                              setTimeout(() => {
                                scrollViewRef.current?.scrollTo({ y: 280, animated: true });
                              }, 100);
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
                            activeOpacity={0.7}
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

                      {/* Register Button */}
                      <TouchableOpacity
                        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                        onPress={handleRegister}
                        disabled={loading}
                        activeOpacity={0.8}
                      >
                        <LinearGradient
                          colors={loading ? ['#9CA3AF', '#6B7280'] : [COLORS.primary, COLORS.secondary]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
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

                      {/* Terms */}
                      <Text style={styles.termsText}>
                        By creating an account, you agree to our{' '}
                        <Text style={styles.termsLink}>Terms</Text> and{' '}
                        <Text style={styles.termsLink}>Privacy Policy</Text>
                      </Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            </KeyboardAvoidingView>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bottomSheetContainer: {
    maxHeight: SCREEN_HEIGHT * 0.9,
  },
  bottomSheetWithKeyboard: {
    maxHeight: SCREEN_HEIGHT * 0.95,
  },
  keyboardView: {
    maxHeight: SCREEN_HEIGHT * 0.95,
  },

  // Modal Sheet
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  logoIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text.primary,
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
  },

  // Mode Toggle
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 4,
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
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text.secondary,
    textAlign: 'center',
    paddingVertical: 12,
  },
  modeButtonTextActive: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Form
  formScroll: {
    maxHeight: SCREEN_HEIGHT * 0.6,
  },
  formContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  form: {
    gap: 0,
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
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
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
    backgroundColor: 'transparent',
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

  // Forgot Password
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // Submit Button
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
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
});