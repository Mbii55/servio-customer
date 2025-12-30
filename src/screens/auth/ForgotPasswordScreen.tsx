import React, { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import api from "../../services/api";
import { COLORS } from "../../constants/colors";

type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token?: string; email?: string } | undefined;
};

type Nav = NativeStackNavigationProp<AuthStackParamList, "ForgotPassword">;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => emailRegex.test(email.trim().toLowerCase()), [email]);

  const handleSend = async () => {
    const normalized = email.trim().toLowerCase();
    if (!emailRegex.test(normalized)) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email: normalized });

      // Generic success (avoid email enumeration)
      Alert.alert(
        "Check your email",
        "If an account exists for this email, we sent a reset link."
      );

      // Optional: take user to Reset screen so they can paste token if email app doesn't auto-open
      navigation.navigate("ResetPassword", { email: normalized });
    } catch (e: any) {
      // Keep generic too
      Alert.alert(
        "Check your email",
        "If an account exists for this email, we sent a reset link."
      );
      navigation.navigate("ResetPassword", { email: normalized });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color={COLORS.text.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.header}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.logo}
            >
              <Ionicons name="key" size={26} color="#fff" />
            </LinearGradient>
            <Text style={styles.title}>Forgot password?</Text>
            <Text style={styles.subtitle}>Enter your email and we’ll send a reset link.</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="mail" size={18} color={COLORS.text.secondary} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={COLORS.text.light}
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <TouchableOpacity
              disabled={!canSubmit || loading}
              onPress={handleSend}
              activeOpacity={0.85}
              style={[styles.btnOuter, (!canSubmit || loading) && { opacity: 0.6 }]}
            >
              <LinearGradient
                colors={loading ? ["#9CA3AF", "#6B7280"] : [COLORS.primary, COLORS.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.btn}
              >
                <Text style={styles.btnText}>{loading ? "Sending..." : "Send reset link"}</Text>
                {!loading && <Ionicons name="arrow-forward" size={18} color="#fff" />}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate("ResetPassword")}
              style={styles.linkRow}
              activeOpacity={0.7}
            >
              <Text style={styles.linkText}>I already have a token</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  scroll: { padding: 20, paddingBottom: 40 },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  header: { alignItems: "center", marginTop: 8, marginBottom: 18 },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  title: { fontSize: 22, fontWeight: "800", color: COLORS.text.primary, marginBottom: 6 },
  subtitle: { fontSize: 14, color: COLORS.text.secondary, textAlign: "center", lineHeight: 20 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  label: { fontSize: 13, fontWeight: "700", color: COLORS.text.primary, marginBottom: 8 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#fff",
  },
  input: { flex: 1, fontSize: 15, color: COLORS.text.primary },
  btnOuter: { marginTop: 14, borderRadius: 16, overflow: "hidden" },
  btn: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  btnText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  linkRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  linkText: { color: COLORS.primary, fontWeight: "800", fontSize: 13 },
});
