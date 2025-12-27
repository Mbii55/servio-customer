// src/screens/auth/LoginScreen.tsx
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

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  const palette = useMemo(() => {
    return {
      surface: (COLORS as any).surface ?? '#FFFFFF',
      border: (COLORS as any).border ?? 'rgba(0,0,0,0.08)',
      muted: (COLORS as any).muted ?? 'rgba(0,0,0,0.04)',
      shadow: (COLORS as any).shadow ?? 'rgba(0,0,0,0.16)',
    };
  }, []);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email is invalid';

    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await signIn(email, password);
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: COLORS.background.primary }]}
    >
      {/* Decorative background */}
      <View pointerEvents="none" style={[styles.blob, styles.blobOne, { backgroundColor: (COLORS as any).primarySoft ?? palette.muted }]} />
      <View pointerEvents="none" style={[styles.blob, styles.blobTwo, { backgroundColor: (COLORS as any).primarySoft2 ?? palette.muted }]} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Hero */}
          <View style={styles.hero}>
            <View style={[styles.heroIcon, { backgroundColor: (COLORS as any).primarySoft ?? palette.muted }]}>
              <Ionicons name="sparkles" size={18} color={COLORS.primary} />
            </View>
            <Text style={styles.brand}>Servio</Text>
            <Text style={styles.heroTitle}>Welcome back</Text>
            <Text style={styles.heroSubtitle}>Sign in to book services faster and manage your orders.</Text>
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
            <Input
              label="Email"
              placeholder="you@example.com"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
              }}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              icon="mail-outline"
            />

            <Input
              label="Password"
              placeholder="••••••••"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
              }}
              error={errors.password}
              secureTextEntry
              icon="lock-closed-outline"
            />

            <TouchableOpacity style={styles.forgotPassword} activeOpacity={0.8}>
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            </TouchableOpacity>

            <Button title="Continue" onPress={handleLogin} loading={loading} style={styles.loginButton} />

            <Text style={styles.legal}>
              By continuing you agree to our Terms & Privacy Policy.
            </Text>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>New here? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')} activeOpacity={0.8}>
              <Text style={styles.signUpText}>Create an account</Text>
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

  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: 4,
    marginBottom: 14,
  },

  forgotPasswordText: {
    fontSize: SIZES.small,
    color: COLORS.primary,
    fontWeight: '700',
  },

  loginButton: {
    marginTop: 4,
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

  signUpText: {
    fontSize: SIZES.body,
    color: COLORS.primary,
    fontWeight: '800',
  },
});
