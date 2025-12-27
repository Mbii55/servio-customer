// src/context/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { User, AuthResponse } from '../types';
import { updateMe, UpdateMeInput } from '../services/profile';
import { registerForPushNotificationsAsync, savePushTokenToBackend } from "../services/pushNotifications";

interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

interface AuthContextData {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: RegisterData) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;

  updateProfile: (payload: UpdateMeInput) => Promise<void>;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

const SUSPENDED_MESSAGE =
  "Your account is suspended due to suspesios activites, contact us at info@servio.com.";

async function clearSession(setUser: (u: User | null) => void) {
  await AsyncStorage.removeItem('token');
  await AsyncStorage.removeItem('user');
  setUser(null);
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStorageData();
  }, []);

  const loadStorageData = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('user');

      if (storedToken && storedUser) {
        // Optimistic load (instant UI)
        try {
          setUser(JSON.parse(storedUser));
        } catch {}

        // Verify token + get latest user status
        try {
          const response = await api.get('/auth/me');
          const freshUser = response.data.user as User;

          // customer-only
          if (freshUser.role !== 'customer') {
            await clearSession(setUser);
            return;
          }

          // ✅ NEW: auto-logout if suspended
          if ((freshUser as any).status === 'suspended') {
            await clearSession(setUser);
            return;
          }

          await AsyncStorage.setItem('user', JSON.stringify(freshUser));
          setUser(freshUser);
        } catch {
          await clearSession(setUser);
        }
      }
    } catch (error) {
      console.error('Error loading storage data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshMe = async () => {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      setUser(null);
      return;
    }

    const response = await api.get('/auth/me');
    const freshUser = response.data.user as User;

    if (freshUser.role !== 'customer') {
      await clearSession(setUser);
      return;
    }

    // ✅ NEW: auto-logout if suspended
    if ((freshUser as any).status === 'suspended') {
      await clearSession(setUser);
      return;
    }

    await AsyncStorage.setItem('user', JSON.stringify(freshUser));
    setUser(freshUser);
  };

const signIn = async (email: string, password: string) => {
  try {
    const response = await api.post<AuthResponse>("/auth/login", { email, password });
    const { token, user: userData } = response.data;

    // Only allow customers
    if (userData.role !== "customer") {
      throw new Error(
        "This app is only for customers. Please use the web portal for service providers."
      );
    }

    // If backend still returns user + status (extra safety)
    if ((userData as any).status === "suspended") {
      throw new Error(SUSPENDED_MESSAGE);
    }

    await AsyncStorage.setItem("token", token);
    await AsyncStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);

    // push token (don’t block login)
    try {
      const expoToken = await registerForPushNotificationsAsync();
      if (expoToken) {
        await savePushTokenToBackend(expoToken);
      }
    } catch (e) {
      console.log("Push token setup failed:", e);
    }
  } catch (error: any) {
    // ✅ IMPORTANT: read message FIRST (your backend uses { message: ... } for 403)
    const backendMsg =
      error.response?.data?.message ||
      error.response?.data?.error ||
      "";

    // If backend indicates suspension, force your exact message
    if (typeof backendMsg === "string" && backendMsg.toLowerCase().includes("suspend")) {
      throw new Error(SUSPENDED_MESSAGE);
    }

    if (error.message?.includes("only for customers")) throw error;

    throw new Error(backendMsg || "Login failed");
  }
};

  const signUp = async (data: RegisterData) => {
    try {
      const response = await api.post<AuthResponse>('/auth/register', {
        email: data.email,
        password: data.password,
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone,
        role: 'customer',
      });

      const { token, user: userData } = response.data;

      if (userData.role !== 'customer') {
        throw new Error('Registration must create a customer account.');
      }

      // ✅ NEW: safety (if suspended for any reason)
      if ((userData as any).status === 'suspended') {
        throw new Error(SUSPENDED_MESSAGE);
      }

      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error || error.response?.data?.message || 'Registration failed'
      );
    }
  };

  const signOut = async () => {
    try {
      await clearSession(setUser);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const updateProfile = async (payload: UpdateMeInput) => {
    const updatedUser = await updateMe(payload);

    if (updatedUser.role !== 'customer') {
      await clearSession(setUser);
      throw new Error('This app is only for customers.');
    }

    // ✅ NEW: if suspension happens after profile update
    if ((updatedUser as any).status === 'suspended') {
      await clearSession(setUser);
      throw new Error(SUSPENDED_MESSAGE);
    }

    await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        isAuthenticated: !!user,
        updateProfile,
        refreshMe,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
