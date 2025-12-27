// src/navigation/types.ts
export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Search: undefined;
  Favorites: undefined;
  Bookings: undefined;
  Profile: undefined;
};

export type HomeStackParamList = {
  HomeScreen: undefined;
  ServiceDetails: { serviceId: string };
  BookService: { serviceId: string };
  BookingSuccess: { bookingId: string };
  Notifications: undefined;
  ProviderDetails: { providerId: string }; // ✅ Added
};

export type SearchStackParamList = {
  Search: {
    initialCategory?: string;
    categoryName?: string;
    searchMode?: 'services' | 'shops';
  };
  ServiceDetails: { serviceId: string };
  ProviderDetails: { providerId: string };
};

export type BookingsStackParamList = {
  BookingsList: undefined;
  BookingDetails: { bookingId: string };
};

export type ProfileStackParamList = {
  ProfileScreen: undefined;
  EditProfile: undefined;
  Addresses: undefined;
  AddAddress: undefined;
  EditAddress: { addressId: string };
  Favorites: undefined;
  Settings: undefined;
};

export type FavoritesStackParamList = {
  FavoritesScreen: undefined;
  ServiceDetails: { serviceId: string };
  BookService: { serviceId: string };
  BookingSuccess: { bookingId: string };
  ProviderDetails: { providerId: string }; // ✅ Added
};