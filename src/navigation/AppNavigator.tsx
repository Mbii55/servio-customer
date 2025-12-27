// src/navigation/AppNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

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

import { COLORS } from '../constants/colors';

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const SearchStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();
const BookingsStack = createNativeStackNavigator();
const FavoritesStack = createNativeStackNavigator();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen
        name="HomeScreen"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <HomeStack.Screen
        name="ServiceDetails"
        component={ServiceDetailsScreen}
        options={{ title: 'Service' }}
      />
      <HomeStack.Screen
        name="ProviderDetails"
        component={ProviderDetailsScreen}
        options={{ headerShown: false }}
      />
      <HomeStack.Screen
        name="BookService"
        component={BookServiceScreen}
        options={{ headerShown: false }}
      />
      <HomeStack.Screen
        name="BookingSuccess"
        component={BookingSuccessScreen}
        options={{ headerShown: false }}
      />
      <HomeStack.Screen
        name="AddAddress"
        component={AddAddressScreen}
        options={{ headerShown: false }}
      />
      <HomeStack.Screen
        name="EditAddress"
        component={EditAddressScreen}
        options={{ headerShown: false }}
      />
      <HomeStack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ headerShown: false }}
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
        options={{ title: 'Service' }}
      />
      <SearchStack.Screen
        name="ProviderDetails"
        component={ProviderDetailsScreen}
        options={{ headerShown: false }}
      />
      <SearchStack.Screen
        name="BookService"
        component={BookServiceScreen}
        options={{ headerShown: false }}
      />
      <SearchStack.Screen
        name="BookingSuccess"
        component={BookingSuccessScreen}
        options={{ headerShown: false }}
      />
      <SearchStack.Screen
        name="AddAddress"
        component={AddAddressScreen}
        options={{ headerShown: false }}
      />
      <SearchStack.Screen
        name="EditAddress"
        component={EditAddressScreen}
        options={{ headerShown: false }}
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
        options={{ headerShown: false }}
      />
      <ProfileStack.Screen
        name="AddAddress"
        component={AddAddressScreen}
        options={{ headerShown: false }}
      />
      <ProfileStack.Screen
        name="EditAddress"
        component={EditAddressScreen}
        options={{ headerShown: false }}
      />
      <ProfileStack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ headerShown: false }}
      />
    </ProfileStack.Navigator>
  );
}

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
        options={{ headerShown: false }}
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
        options={{ title: 'Favorites' }}
      />
      <FavoritesStack.Screen
        name="ServiceDetails"
        component={ServiceDetailsScreen}
        options={{ title: 'Service' }}
      />
      <FavoritesStack.Screen
        name="ProviderDetails"
        component={ProviderDetailsScreen}
        options={{ headerShown: false }}
      />
      <FavoritesStack.Screen
        name="BookService"
        component={BookServiceScreen}
        options={{ headerShown: false }}
      />
      <FavoritesStack.Screen
        name="BookingSuccess"
        component={BookingSuccessScreen}
        options={{ headerShown: false }}
      />
      <FavoritesStack.Screen
        name="AddAddress"
        component={AddAddressScreen}
        options={{ headerShown: false }}
      />
      <FavoritesStack.Screen
        name="EditAddress"
        component={EditAddressScreen}
        options={{ headerShown: false }}
      />
    </FavoritesStack.Navigator>
  );
}

export const AppNavigator: React.FC = () => {
  const { loading } = useAuth();

  if (loading) return <LoadingScreen />;

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.text.secondary,
        tabBarStyle: {
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackNavigator}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="Search"
        component={SearchStackNavigator}
        options={{
          tabBarLabel: 'Explore',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="compass-outline" size={size} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="Bookings"
        component={BookingsStackNavigator}
        options={{
          tabBarLabel: 'Bookings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Favorites"
        component={FavoritesStackNavigator}
        options={{
          tabBarLabel: 'Favorites',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="heart-outline" size={size} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileStackNavigator}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};