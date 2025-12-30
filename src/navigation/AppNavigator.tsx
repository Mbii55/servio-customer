// src/navigation/AppNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, Platform } from 'react-native';

import { useAuth } from '../context/AuthContext';
import { LoadingScreen } from '../components/common/LoadingScreen';

import { HomeScreen } from '../screens/home/HomeScreen';
import { ExploreScreen } from '../screens/search/ExploreScreen';
import { BookingsScreen } from '../screens/bookings/BookingsScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { BookServiceScreen } from '../screens/bookings/BookServiceScreen';
import { AddAddressScreen } from '../screens/addresses/AddAddressScreen';
import { AddressesListScreen } from '../screens/addresses/AddressesListScreen';
import { EditAddressScreen } from '../screens/addresses/EditAddressScreen';
import { BookingSuccessScreen } from '../screens/bookings/BookingSuccessScreen';
import { BookingDetailsScreen } from '../screens/bookings/BookingDetailsScreen';
import { EditProfileScreen } from '../screens/profile/EditProfileScreen';
import { ServiceDetailsScreen } from '../screens/home/ServiceDetailsScreen';
import { FavoritesScreen } from '../screens/favorites/FavoritesScreen';
import { NotificationsScreen } from '../screens/notifications/NotificationsScreen';
import { ProviderDetailsScreen } from '../screens/home/ProviderDetailsScreen';
import { ReviewScreen } from '../screens/bookings/ReviewScreen'; // ✅ NEW IMPORT

import { COLORS } from '../constants/colors';

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const SearchStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();
const BookingsStack = createNativeStackNavigator();
const FavoritesStack = createNativeStackNavigator();

// Custom Tab Bar Icon with Badge
const TabBarIcon = ({ 
  name, 
  color, 
  size, 
  focused 
}: { 
  name: string; 
  color: string; 
  size: number; 
  focused: boolean;
}) => {
  return (
    <View style={styles.iconContainer}>
      {focused && <View style={styles.activeIndicator} />}
      <Ionicons name={name as any} size={size} color={color} />
    </View>
  );
};

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <HomeStack.Screen
        name="HomeScreen"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <HomeStack.Screen
        name="ServiceDetails"
        component={ServiceDetailsScreen}
        options={{ 
          headerShown: false,
          animation: 'slide_from_right'
        }}
      />
      <HomeStack.Screen
        name="ProviderDetails"
        component={ProviderDetailsScreen}
        options={{ 
          headerShown: false,
          animation: 'slide_from_right'
        }}
      />
      <HomeStack.Screen
        name="BookService"
        component={BookServiceScreen}
        options={{ 
          headerShown: false,
          animation: 'slide_from_bottom'
        }}
      />
      <HomeStack.Screen
        name="BookingSuccess"
        component={BookingSuccessScreen}
        options={{ 
          headerShown: false,
          animation: 'fade'
        }}
      />
      <HomeStack.Screen
        name="AddAddress"
        component={AddAddressScreen}
        options={{ 
          headerShown: false,
          animation: 'slide_from_bottom'
        }}
      />
      <HomeStack.Screen
        name="EditAddress"
        component={EditAddressScreen}
        options={{ 
          headerShown: false,
          animation: 'slide_from_bottom'
        }}
      />
      <HomeStack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ 
          headerShown: false,
          animation: 'slide_from_right'
        }}
      />
      <HomeStack.Screen
        name="BookingDetails"
        component={BookingDetailsScreen}
        options={{ 
          headerShown: false,
          animation: 'slide_from_bottom'
        }}
      />
    </HomeStack.Navigator>
  );
}

function SearchStackNavigator() {
  return (
    <SearchStack.Navigator>
      <SearchStack.Screen
        name="ExploreScreen"
        component={ExploreScreen}
        options={{ headerShown: false }}
      />
      <SearchStack.Screen
        name="ServiceDetails"
        component={ServiceDetailsScreen}
        options={{ 
          headerShown: false,
          animation: 'slide_from_right'
        }}
      />
      <SearchStack.Screen
        name="ProviderDetails"
        component={ProviderDetailsScreen}
        options={{ 
          headerShown: false,
          animation: 'slide_from_right'
        }}
      />
      <SearchStack.Screen
        name="BookService"
        component={BookServiceScreen}
        options={{ 
          headerShown: false,
          animation: 'slide_from_bottom'
        }}
      />
      <SearchStack.Screen
        name="BookingSuccess"
        component={BookingSuccessScreen}
        options={{ 
          headerShown: false,
          animation: 'fade'
        }}
      />
      <SearchStack.Screen
        name="BookingDetails"
        component={BookingDetailsScreen}
        options={{ 
          headerShown: false,
          animation: 'slide_from_bottom'
        }}
      />
      <SearchStack.Screen
        name="AddAddress"
        component={AddAddressScreen}
        options={{ 
          headerShown: false,
          animation: 'slide_from_bottom'
        }}
      />
      <SearchStack.Screen
        name="EditAddress"
        component={EditAddressScreen}
        options={{ 
          headerShown: false,
          animation: 'slide_from_bottom'
        }}
      />
      <SearchStack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ 
          headerShown: false,
          animation: 'slide_from_right'
        }}
      />
      
    </SearchStack.Navigator>
  );
}

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator>
      <ProfileStack.Screen
        name="ProfileScreen"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <ProfileStack.Screen
        name="Addresses"
        component={AddressesListScreen}
        options={{ 
          headerShown: false,
          animation: 'slide_from_right'
        }}
      />
      <ProfileStack.Screen
        name="AddAddress"
        component={AddAddressScreen}
        options={{ 
          headerShown: false,
          animation: 'slide_from_bottom'
        }}
      />
      <ProfileStack.Screen
        name="EditAddress"
        component={EditAddressScreen}
        options={{ 
          headerShown: false,
          animation: 'slide_from_bottom'
        }}
      />
      <ProfileStack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ 
          headerShown: false,
          animation: 'slide_from_right'
        }}
      />
    </ProfileStack.Navigator>
  );
}

// ✅ UPDATED: Added Review screen to BookingsStack
function BookingsStackNavigator() {
  return (
    <BookingsStack.Navigator>
      <BookingsStack.Screen
        name="BookingsScreen"
        component={BookingsScreen}
        options={{ headerShown: false }}
      />
      <BookingsStack.Screen
        name="BookingDetails"
        component={BookingDetailsScreen}
        options={{ 
          headerShown: false,
          animation: 'slide_from_bottom'
        }}
      />
      {/* ✅ NEW: Review Screen */}
      <BookingsStack.Screen
        name="Review"
        component={ReviewScreen}
        options={{ 
          headerShown: false,
          animation: 'slide_from_bottom',
          presentation: 'modal', // Slides up from bottom on iOS
        }}
      />
    </BookingsStack.Navigator>
  );
}

function FavoritesStackNavigator() {
  return (
    <FavoritesStack.Navigator>
      <FavoritesStack.Screen
        name="FavoritesScreen"
        component={FavoritesScreen}
        options={{ headerShown: false }}
      />
      <FavoritesStack.Screen
        name="ServiceDetails"
        component={ServiceDetailsScreen}
        options={{ 
          headerShown: false,
          animation: 'slide_from_right'
        }}
      />
      <FavoritesStack.Screen
        name="ProviderDetails"
        component={ProviderDetailsScreen}
        options={{ 
          headerShown: false,
          animation: 'slide_from_right'
        }}
      />
      <FavoritesStack.Screen
        name="BookService"
        component={BookServiceScreen}
        options={{ 
          headerShown: false,
          animation: 'slide_from_bottom'
        }}
      />
      <FavoritesStack.Screen
        name="BookingSuccess"
        component={BookingSuccessScreen}
        options={{ 
          headerShown: false,
          animation: 'fade'
        }}
      />
      <FavoritesStack.Screen
        name="AddAddress"
        component={AddAddressScreen}
        options={{ 
          headerShown: false,
          animation: 'slide_from_bottom'
        }}
      />
      <FavoritesStack.Screen
        name="EditAddress"
        component={EditAddressScreen}
        options={{ 
          headerShown: false,
          animation: 'slide_from_bottom'
        }}
      />
    </FavoritesStack.Navigator>
  );
}

export const AppNavigator: React.FC = () => {
  const { loading } = useAuth();

  if (loading) return <LoadingScreen />;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          elevation: 20,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: -4,
          },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 8,
          height: Platform.OS === 'ios' ? 85 : 65,
          position: 'absolute',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
        headerShown: false,
        tabBarHideOnKeyboard: true,
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackNavigator}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <TabBarIcon
              name={focused ? 'home' : 'home-outline'}
              color={color}
              size={size}
              focused={focused}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Search"
        component={SearchStackNavigator}
        options={{
          tabBarLabel: 'Explore',
          tabBarIcon: ({ color, size, focused }) => (
            <TabBarIcon
              name={focused ? 'compass' : 'compass-outline'}
              color={color}
              size={size}
              focused={focused}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Bookings"
        component={BookingsStackNavigator}
        options={{
          tabBarLabel: 'Bookings',
          tabBarIcon: ({ color, size, focused }) => (
            <TabBarIcon
              name={focused ? 'calendar' : 'calendar-outline'}
              color={color}
              size={size}
              focused={focused}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Favorites"
        component={FavoritesStackNavigator}
        options={{
          tabBarLabel: 'Favorites',
          tabBarIcon: ({ color, size, focused }) => (
            <TabBarIcon
              name={focused ? 'heart' : 'heart-outline'}
              color={color}
              size={size}
              focused={focused}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileStackNavigator}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <TabBarIcon
              name={focused ? 'person' : 'person-outline'}
              color={color}
              size={size}
              focused={focused}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    top: -8,
    width: 32,
    height: 3,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
});