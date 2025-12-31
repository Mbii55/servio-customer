// src/context/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus, Alert } from 'react-native';
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
  "Your account has been suspended due to suspicious activities. Please contact our support team at for assistance.";

const SUSPENDED_TITLE = "Account Suspended";

async function clearSession(setUser: (u: User | null) => void) {
  await AsyncStorage.removeItem('token');
  await AsyncStorage.removeItem('user');
  setUser(null);
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Polling interval ref
  const statusCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    loadStorageData();
  }, []);

  // Setup status polling and app state monitoring
  useEffect(() => {
    if (!user) {
      // Clear any existing interval when user logs out
      if (statusCheckIntervalRef.current) {
        clearInterval(statusCheckIntervalRef.current);
        statusCheckIntervalRef.current = null;
      }
      return;
    }

    // Check status immediately when user logs in
    checkUserStatus();

    // Poll every 30 seconds while user is logged in
    statusCheckIntervalRef.current = setInterval(() => {
      checkUserStatus();
    }, 30000); // 30 seconds

    // Monitor app state changes (foreground/background)
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      if (statusCheckIntervalRef.current) {
        clearInterval(statusCheckIntervalRef.current);
      }
      subscription.remove();
    };
  }, [user]);

  // Check user status when app comes to foreground
  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (
      appStateRef.current.match(/inactive|background/) &&
      nextAppState === 'active' &&
      user
    ) {
      // App has come to foreground, check user status
      checkUserStatus();
    }
    appStateRef.current = nextAppState;
  };

  // Check if user is suspended
  const checkUserStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token || !user) return;

      const response = await api.get('/auth/me');
      const freshUser = response.data.user as User;

      // Check if user was suspended
      if ((freshUser as any).status === 'suspended') {
        console.log('User account suspended, logging out...');
        await clearSession(setUser);
        
        // Show suspension alert
        Alert.alert(
          SUSPENDED_TITLE,
          SUSPENDED_MESSAGE,
          [{ text: 'OK', style: 'default' }],
          { cancelable: false }
        );
        return;
      }

      // Check if role changed from customer
      if (freshUser.role !== 'customer') {
        console.log('User role changed, logging out...');
        await clearSession(setUser);
        
        Alert.alert(
          'Access Denied',
          'This app is only for customers. Please use the web portal for service providers.',
          [{ text: 'OK', style: 'default' }],
          { cancelable: false }
        );
        return;
      }

      // Update user data if still valid
      await AsyncStorage.setItem('user', JSON.stringify(freshUser));
      setUser(freshUser);
    } catch (error) {
      console.error('Status check failed:', error);
      // Don't logout on network errors, only on 401/403
      if ((error as any)?.response?.status === 401 || (error as any)?.response?.status === 403) {
        await clearSession(setUser);
      }
    }
  };

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

          // auto-logout if suspended
          if ((freshUser as any).status === 'suspended') {
            await clearSession(setUser);
            
            // Show alert on app load
            Alert.alert(
              SUSPENDED_TITLE,
              SUSPENDED_MESSAGE,
              [{ text: 'OK', style: 'default' }],
              { cancelable: false }
            );
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
      
      Alert.alert(
        'Access Denied',
        'This app is only for customers. Please use the web portal for service providers.',
        [{ text: 'OK', style: 'default' }],
        { cancelable: false }
      );
      return;
    }

    // auto-logout if suspended
    if ((freshUser as any).status === 'suspended') {
      await clearSession(setUser);
      
      Alert.alert(
        SUSPENDED_TITLE,
        SUSPENDED_MESSAGE,
        [{ text: 'OK', style: 'default' }],
        { cancelable: false }
      );
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

      // push token (don't block login)
      try {
        const expoToken = await registerForPushNotificationsAsync();
        if (expoToken) {
          await savePushTokenToBackend(expoToken);
        }
      } catch (e) {
        console.log("Push token setup failed:", e);
      }
    } catch (error: any) {
      // IMPORTANT: read message FIRST (your backend uses { message: ... } for 403)
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

      // safety (if suspended for any reason)
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

    // if suspension happens after profile update
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