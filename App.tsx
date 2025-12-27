// App.tsx
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import { BookingProvider } from './src/context/BookingContext';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <AuthProvider>
          <BookingProvider>
            <AppNavigator />
            <StatusBar style="auto" />
          </BookingProvider>
        </AuthProvider>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}