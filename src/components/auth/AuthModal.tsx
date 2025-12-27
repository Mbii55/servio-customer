// src/components/auth/AuthModal.tsx
import React, { useEffect, useMemo, useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { COLORS, SIZES } from '../../constants/colors';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

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
  const [registerErrors, setRegisterErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Keep modal mode aligned with initialMode whenever it opens
    if (visible) setMode(initialMode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const palette = useMemo(() => {
    // Fallbacks in case your COLORS doesn't have these values
    return {
      surface: (COLORS as any).surface ?? '#FFFFFF',
      border: (COLORS as any).border ?? 'rgba(0,0,0,0.08)',
      muted: (COLORS as any).muted ?? 'rgba(0,0,0,0.04)',
      shadow: (COLORS as any).shadow ?? 'rgba(0,0,0,0.14)',
      backdrop: 'rgba(0,0,0,0.52)',
    };
  }, []);

  const resetForm = () => {
    setLoginEmail('');
    setLoginPassword('');
    setLoginErrors({});
    setRegisterData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    });
    setRegisterErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
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

    if (!registerData.password) errors.password = 'Password is required';
    else if (registerData.password.length < 6) errors.password = 'Password must be at least 6 characters';

    if (registerData.password !== registerData.confirmPassword)
      errors.confirmPassword = 'Passwords do not match';

    setRegisterErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateLogin()) return;

    setLoading(true);
    try {
      await signIn(loginEmail, loginPassword);
      handleClose();
    } catch (error: any) {
      Alert.alert('Login Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!validateRegister()) return;

    setLoading(true);
    try {
      await signUp({
        email: registerData.email,
        password: registerData.password,
        first_name: registerData.firstName,
        last_name: registerData.lastName,
        phone: registerData.phone || undefined,
      });
      handleClose();
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (next: 'login' | 'register') => {
    setMode(next);
    resetForm();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Backdrop */}
        <Pressable style={[styles.backdrop, { backgroundColor: palette.backdrop }]} onPress={handleClose} />

        {/* Sheet */}
        <View style={[styles.sheet, { backgroundColor: COLORS.background?.primary ?? palette.surface }]}>
          {/* Grabber */}
          <View style={[styles.grabber, { backgroundColor: palette.border }]} />

          {/* Brand row */}
          <View style={styles.brandRow}>
            <View style={[styles.brandIcon, { backgroundColor: (COLORS as any).primarySoft ?? palette.muted }]}>
              <Ionicons name="sparkles" size={18} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.brandTitle}>Servio</Text>
              <Text style={styles.brandSubtitle}>
                {mode === 'login' ? 'Welcome back — let’s get it done.' : 'Create your account in seconds.'}
              </Text>
            </View>

            <TouchableOpacity onPress={handleClose} style={styles.closeButton} accessibilityLabel="Close auth modal">
              <Ionicons name="close" size={22} color={COLORS.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Segmented control */}
          <View style={[styles.segmentWrap, { backgroundColor: palette.muted, borderColor: palette.border }]}>
            <TouchableOpacity
              onPress={() => switchMode('login')}
              style={[
                styles.segment,
                mode === 'login' && {
                  backgroundColor: palette.surface,
                  borderColor: palette.border,
                },
              ]}
              activeOpacity={0.9}
            >
              <Text
                style={[
                  styles.segmentText,
                  { color: mode === 'login' ? COLORS.text.primary : COLORS.text.secondary },
                ]}
              >
                Sign In
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => switchMode('register')}
              style={[
                styles.segment,
                mode === 'register' && {
                  backgroundColor: palette.surface,
                  borderColor: palette.border,
                },
              ]}
              activeOpacity={0.9}
            >
              <Text
                style={[
                  styles.segmentText,
                  { color: mode === 'register' ? COLORS.text.primary : COLORS.text.secondary },
                ]}
              >
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 28 }}
          >
            {mode === 'login' ? (
              <View style={styles.form}>
                <Input
                  label="Email"
                  placeholder="you@example.com"
                  value={loginEmail}
                  onChangeText={(t) => {
                    setLoginEmail(t);
                    if (loginErrors.email) setLoginErrors((p) => ({ ...p, email: undefined }));
                  }}
                  error={loginErrors.email}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  icon="mail-outline"
                />

                <Input
                  label="Password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChangeText={(t) => {
                    setLoginPassword(t);
                    if (loginErrors.password) setLoginErrors((p) => ({ ...p, password: undefined }));
                  }}
                  error={loginErrors.password}
                  secureTextEntry
                  icon="lock-closed-outline"
                />

                <TouchableOpacity style={styles.forgotRow} activeOpacity={0.8}>
                  <Text style={styles.forgotText}>Forgot password?</Text>
                </TouchableOpacity>

                <Button title="Continue" onPress={handleLogin} loading={loading} style={styles.primaryBtn} />

                <Text style={styles.helperText}>
                  By continuing you agree to our Terms & Privacy Policy.
                </Text>
              </View>
            ) : (
              <View style={styles.form}>
                <View style={styles.row}>
                  <View style={styles.halfInput}>
                    <Input
                      label="First name"
                      placeholder="John"
                      value={registerData.firstName}
                      onChangeText={(text) =>
                        setRegisterData((p) => ({ ...p, firstName: text }))
                      }
                      error={registerErrors.firstName}
                      icon="person-outline"
                    />
                  </View>
                  <View style={styles.halfInput}>
                    <Input
                      label="Last name"
                      placeholder="Doe"
                      value={registerData.lastName}
                      onChangeText={(text) =>
                        setRegisterData((p) => ({ ...p, lastName: text }))
                      }
                      error={registerErrors.lastName}
                      icon="person-outline"
                    />
                  </View>
                </View>

                <Input
                  label="Email"
                  placeholder="john.doe@example.com"
                  value={registerData.email}
                  onChangeText={(text) => setRegisterData((p) => ({ ...p, email: text }))}
                  error={registerErrors.email}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  icon="mail-outline"
                />

                <Input
                  label="Phone (optional)"
                  placeholder="+974 1234 5678"
                  value={registerData.phone}
                  onChangeText={(text) => setRegisterData((p) => ({ ...p, phone: text }))}
                  keyboardType="phone-pad"
                  icon="call-outline"
                />

                <Input
                  label="Password"
                  placeholder="Create a password"
                  value={registerData.password}
                  onChangeText={(text) => setRegisterData((p) => ({ ...p, password: text }))}
                  error={registerErrors.password}
                  secureTextEntry
                  icon="lock-closed-outline"
                />

                <Input
                  label="Confirm password"
                  placeholder="Re-enter password"
                  value={registerData.confirmPassword}
                  onChangeText={(text) => setRegisterData((p) => ({ ...p, confirmPassword: text }))}
                  error={registerErrors.confirmPassword}
                  secureTextEntry
                  icon="lock-closed-outline"
                />

                <Button
                  title="Create account"
                  onPress={handleRegister}
                  loading={loading}
                  style={styles.primaryBtn}
                />

                <Text style={styles.helperText}>
                  By creating an account, you agree to our Terms & Privacy Policy.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'flex-end' },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },

  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 10,
    paddingHorizontal: SIZES.padding * 1.5,
    maxHeight: '92%',
  },

  grabber: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 999,
    marginBottom: 12,
  },

  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },

  brandIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  brandTitle: {
    fontSize: SIZES.h3,
    fontWeight: '800',
    color: COLORS.text.primary,
    lineHeight: 22,
  },

  brandSubtitle: {
    marginTop: 2,
    fontSize: SIZES.small,
    color: COLORS.text.secondary,
  },

  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  segmentWrap: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    marginBottom: 14,
  },

  segment: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },

  segmentText: {
    fontSize: SIZES.body,
    fontWeight: '700',
  },

  form: {
    paddingTop: 6,
  },

  row: {
    flexDirection: 'row',
    marginHorizontal: -8,
  },

  halfInput: {
    flex: 1,
    marginHorizontal: 8,
  },

  forgotRow: {
    alignSelf: 'flex-end',
    marginTop: 4,
    marginBottom: 14,
  },

  forgotText: {
    fontSize: SIZES.small,
    color: COLORS.primary,
    fontWeight: '700',
  },

  primaryBtn: {
    marginTop: 6,
  },

  helperText: {
    marginTop: 12,
    fontSize: SIZES.small,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
    paddingBottom: 18,
  },
});
