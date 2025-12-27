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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
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

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const palette = useMemo(() => {
    return {
      surface: (COLORS as any).surface ?? '#FFFFFF',
      border: (COLORS as any).border ?? 'rgba(0,0,0,0.08)',
      muted: (COLORS as any).muted ?? 'rgba(0,0,0,0.04)',
      shadow: (COLORS as any).shadow ?? 'rgba(0,0,0,0.16)',
      ok: (COLORS as any).success ?? '#16A34A',
    };
  }, []);

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

  const rules = useMemo(() => {
    const pwd = formData.password;
    return [
      { label: 'At least 6 characters', ok: pwd.length >= 6 },
      { label: 'One uppercase letter', ok: /[A-Z]/.test(pwd) },
      { label: 'One lowercase letter', ok: /[a-z]/.test(pwd) },
      { label: 'One number', ok: /\d/.test(pwd) },
    ];
  }, [formData.password]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: COLORS.background.primary }]}
    >
      {/* Decorative background blobs */}
      <View
        pointerEvents="none"
        style={[
          styles.blob,
          styles.blobOne,
          { backgroundColor: (COLORS as any).primarySoft ?? palette.muted },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.blob,
          styles.blobTwo,
          { backgroundColor: (COLORS as any).primarySoft2 ?? palette.muted },
        ]}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Hero */}
          <View style={styles.hero}>
            <View style={[styles.heroIcon, { backgroundColor: (COLORS as any).primarySoft ?? palette.muted }]}>
              <Ionicons name="person-add" size={18} color={COLORS.primary} />
            </View>
            <Text style={styles.brand}>Servio</Text>
            <Text style={styles.heroTitle}>Create account</Text>
            <Text style={styles.heroSubtitle}>
              Book trusted services, track orders, and save favorites.
            </Text>
          </View>

          {/* Card */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: palette.surface,
                borderColor: palette.border,
                shadowColor: palette.shadow,
              },
            ]}
          >
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Input
                  label="First name"
                  placeholder="John"
                  value={formData.firstName}
                  onChangeText={(text) => updateField('firstName', text)}
                  error={errors.firstName}
                  icon="person-outline"
                />
              </View>
              <View style={styles.halfInput}>
                <Input
                  label="Last name"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChangeText={(text) => updateField('lastName', text)}
                  error={errors.lastName}
                  icon="person-outline"
                />
              </View>
            </View>

            <Input
              label="Email"
              placeholder="you@example.com"
              value={formData.email}
              onChangeText={(text) => updateField('email', text)}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              icon="mail-outline"
            />

            <Input
              label="Phone (optional)"
              placeholder="+974 1234 5678"
              value={formData.phone}
              onChangeText={(text) => updateField('phone', text)}
              error={errors.phone}
              keyboardType="phone-pad"
              icon="call-outline"
            />

            <Input
              label="Password"
              placeholder="Create a password"
              value={formData.password}
              onChangeText={(text) => updateField('password', text)}
              error={errors.password}
              secureTextEntry
              icon="lock-closed-outline"
            />

            <Input
              label="Confirm password"
              placeholder="Re-enter password"
              value={formData.confirmPassword}
              onChangeText={(text) => updateField('confirmPassword', text)}
              error={errors.confirmPassword}
              secureTextEntry
              icon="lock-closed-outline"
            />

            {/* Password checklist */}
            <View style={[styles.rulesBox, { backgroundColor: palette.muted, borderColor: palette.border }]}>
              <Text style={styles.rulesTitle}>Password checklist</Text>
              {rules.map((r) => (
                <View key={r.label} style={styles.ruleRow}>
                  <View
                    style={[
                      styles.ruleDot,
                      {
                        backgroundColor: r.ok ? palette.ok : 'transparent',
                        borderColor: r.ok ? palette.ok : palette.border,
                      },
                    ]}
                  >
                    {r.ok ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
                  </View>
                  <Text style={[styles.ruleText, { color: r.ok ? COLORS.text.primary : COLORS.text.secondary }]}>
                    {r.label}
                  </Text>
                </View>
              ))}
            </View>

            <Button
              title="Create account"
              onPress={handleRegister}
              loading={loading}
              style={styles.primaryBtn}
            />

            <Text style={styles.legal}>
              By creating an account you agree to our Terms & Privacy Policy.
            </Text>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.8}>
              <Text style={styles.signInText}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },

  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },

  content: {
    flex: 1,
    paddingHorizontal: SIZES.padding * 1.5,
    paddingTop: 54,
  },

  blob: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.7,
  },
  blobOne: {
    width: 240,
    height: 240,
    top: -70,
    left: -70,
  },
  blobTwo: {
    width: 280,
    height: 280,
    bottom: -90,
    right: -90,
  },

  hero: {
    marginBottom: 18,
  },

  heroIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  brand: {
    fontSize: SIZES.body,
    fontWeight: '800',
    color: COLORS.text.primary,
    marginBottom: 8,
  },

  heroTitle: {
    fontSize: SIZES.h1,
    fontWeight: '900',
    color: COLORS.text.primary,
    marginBottom: 8,
  },

  heroSubtitle: {
    fontSize: SIZES.body,
    color: COLORS.text.secondary,
    lineHeight: 22,
  },

  card: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },

  row: {
    flexDirection: 'row',
    marginHorizontal: -8,
  },
  halfInput: {
    flex: 1,
    marginHorizontal: 8,
  },

  rulesBox: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginTop: 6,
    marginBottom: 14,
  },
  rulesTitle: {
    fontSize: SIZES.small,
    fontWeight: '800',
    color: COLORS.text.primary,
    marginBottom: 10,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  ruleDot: {
    width: 22,
    height: 22,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ruleText: {
    fontSize: SIZES.small,
    fontWeight: '600',
  },

  primaryBtn: {
    marginTop: 6,
  },

  legal: {
    marginTop: 12,
    fontSize: SIZES.small,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
  },

  footerText: {
    fontSize: SIZES.body,
    color: COLORS.text.secondary,
  },

  signInText: {
    fontSize: SIZES.body,
    color: COLORS.primary,
    fontWeight: '800',
  },
});
