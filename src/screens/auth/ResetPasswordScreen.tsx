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
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import api from "../../services/api";
import { COLORS } from "../../constants/colors";

type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token?: string; email?: string } | undefined;
};

type Nav = NativeStackNavigationProp<AuthStackParamList, "ResetPassword">;
type Rt = RouteProp<AuthStackParamList, "ResetPassword">;

export const ResetPasswordScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rt>();

  const [token, setToken] = useState(route.params?.token ?? "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const passwordOk = useMemo(() => password.length >= 8, [password]);
  const confirmOk = useMemo(() => confirm.length > 0 && confirm === password, [confirm, password]);
  const canSubmit = useMemo(() => token.trim().length > 0 && passwordOk && confirmOk, [
    token,
    passwordOk,
    confirmOk,
  ]);

  const handleReset = async () => {
    if (!token.trim()) return Alert.alert("Missing token", "Use the token from your email link.");
    if (!passwordOk) return Alert.alert("Weak password", "Password must be at least 8 characters.");
    if (!confirmOk) return Alert.alert("Mismatch", "Passwords do not match.");

    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token: token.trim(), password });

      Alert.alert("Success", "Password updated. Please login again.");
      navigation.reset({ index: 0, routes: [{ name: "Login" }] });
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        "Failed to reset password. The link may be expired.";
      Alert.alert("Reset failed", msg);
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
              <Ionicons name="lock-closed" size={26} color="#fff" />
            </LinearGradient>
            <Text style={styles.title}>Set a new password</Text>
            <Text style={styles.subtitle}>Use the link from your email or paste the token.</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Reset token</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="key" size={18} color={COLORS.text.secondary} />
              <TextInput
                value={token}
                onChangeText={setToken}
                placeholder="Paste token here"
                placeholderTextColor={COLORS.text.light}
                style={styles.input}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <Text style={[styles.label, { marginTop: 14 }]}>New password</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed" size={18} color={COLORS.text.secondary} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Minimum 8 characters"
                placeholderTextColor={COLORS.text.light}
                style={styles.input}
                secureTextEntry={!showPw}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPw((v) => !v)} style={styles.eyeBtn}>
                <Ionicons name={showPw ? "eye-off" : "eye"} size={20} color={COLORS.text.secondary} />
              </TouchableOpacity>
            </View>
            {!passwordOk && password.length > 0 && (
              <Text style={styles.hintError}>Password must be at least 8 characters.</Text>
            )}

            <Text style={[styles.label, { marginTop: 14 }]}>Confirm password</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="checkmark-circle" size={18} color={COLORS.text.secondary} />
              <TextInput
                value={confirm}
                onChangeText={setConfirm}
                placeholder="Re-enter password"
                placeholderTextColor={COLORS.text.light}
                style={styles.input}
                secureTextEntry={!showPw}
                autoCapitalize="none"
              />
            </View>
            {!confirmOk && confirm.length > 0 && (
              <Text style={styles.hintError}>Passwords do not match.</Text>
            )}

            <TouchableOpacity
              disabled={!canSubmit || loading}
              onPress={handleReset}
              activeOpacity={0.85}
              style={[styles.btnOuter, (!canSubmit || loading) && { opacity: 0.6 }]}
            >
              <LinearGradient
                colors={loading ? ["#9CA3AF", "#6B7280"] : [COLORS.primary, COLORS.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.btn}
              >
                <Text style={styles.btnText}>{loading ? "Updating..." : "Update password"}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate("ForgotPassword")}
            style={styles.linkRow}
            activeOpacity={0.7}
          >
            <Text style={styles.linkText}>Need a new reset email?</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
          </TouchableOpacity>
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
  eyeBtn: { paddingHorizontal: 4, paddingVertical: 4 },
  hintError: { marginTop: 8, color: "#DC2626", fontSize: 12, fontWeight: "700" },
  btnOuter: { marginTop: 16, borderRadius: 16, overflow: "hidden" },
  btn: { paddingVertical: 14, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  btnText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  linkRow: { marginTop: 14, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6 },
  linkText: { color: COLORS.primary, fontWeight: "800", fontSize: 13 },
});
