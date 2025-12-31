// App.tsx
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './src/context/AuthContext';
import { BookingProvider } from './src/context/BookingContext';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { queryClient, setupQueryClientFocusManager } from './src/utils/queryClient';

export default function App() {
  // Setup focus manager for automatic refetching when app comes to foreground
  useEffect(() => {
    const cleanup = setupQueryClientFocusManager();
    return cleanup;
  }, []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <NavigationContainer>
          <AuthProvider>
            <BookingProvider>
              <AppNavigator />
              <StatusBar style="auto" />
            </BookingProvider>
          </AuthProvider>
        </NavigationContainer>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}