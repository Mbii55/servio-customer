// src/screens/profile/ProfileScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { AuthModal } from '../../components/auth/AuthModal';
import { COLORS, SIZES } from '../../constants/colors';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type NavProp = NativeStackNavigationProp<any>;

export const ProfileScreen: React.FC = () => {
  const { user, signOut, isAuthenticated, refreshMe } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const navigation = useNavigation<NavProp>();

  const [avatarFailed, setAvatarFailed] = useState(false);

  useEffect(() => {
    setAvatarFailed(false);
  }, [user?.profile_image, user?.id]);

  useFocusEffect(
    React.useCallback(() => {
      if (isAuthenticated) {
        refreshMe?.().catch(() => {});
      }
    }, [isAuthenticated, refreshMe])
  );

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.guestContainer}>
          <LinearGradient
            colors={['#EFF6FF', '#DBEAFE']}
            style={styles.guestIconContainer}
          >
            <Ionicons name="person-outline" size={48} color={COLORS.primary} />
          </LinearGradient>

          <Text style={styles.guestTitle}>Welcome to Servio</Text>
          <Text style={styles.guestSubtitle}>
            Sign in to book services, save favorites, and manage your bookings
          </Text>

          <TouchableOpacity
            style={styles.guestButton}
            onPress={() => setShowAuthModal(true)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.guestButtonGradient}
            >
              <Text style={styles.guestButtonText}>Sign In / Sign Up</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <AuthModal 
          visible={showAuthModal} 
          onClose={() => setShowAuthModal(false)} 
          initialMode="login" 
        />
      </SafeAreaView>
    );
  }

  const initials = `${user?.first_name?.[0] ?? ''}${user?.last_name?.[0] ?? ''}`.toUpperCase();
  const showAvatarImage = !!user?.profile_image && !avatarFailed;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <LinearGradient
            colors={['#F9FAFB', '#FFFFFF']}
            style={styles.profileHeaderGradient}
          >
            {/* Avatar */}
            <View style={styles.avatarContainer}>
              {showAvatarImage ? (
                <Image
                  source={{ uri: user!.profile_image! }}
                  style={styles.avatarImage}
                  resizeMode="cover"
                  onError={() => setAvatarFailed(true)}
                />
              ) : (
                <LinearGradient
                  colors={[COLORS.primary, COLORS.secondary]}
                  style={styles.avatarPlaceholder}
                >
                  <Text style={styles.avatarText}>{initials || 'U'}</Text>
                </LinearGradient>
              )}

              {/* Edit Badge */}
              <TouchableOpacity 
                style={styles.editBadge}
                onPress={() => navigation.navigate('EditProfile')}
                activeOpacity={0.8}
              >
                <Ionicons name="camera" size={14} color="#FFF" />
              </TouchableOpacity>
            </View>

            {/* User Info */}
            <Text style={styles.userName}>
              {user?.first_name} {user?.last_name}
            </Text>
            <Text style={styles.userEmail}>{user?.email}</Text>

            {/* Quick Stats */}
            <View style={styles.quickStats}>
              <QuickStat
                icon="heart"
                label="Favorites"
                onPress={() => navigation.navigate('Favorites')}
              />
              <View style={styles.statDivider} />
              <QuickStat
                icon="calendar"
                label="Bookings"
                onPress={() => navigation.navigate('Bookings')}
              />
              <View style={styles.statDivider} />
              <QuickStat
                icon="location"
                label="Addresses"
                onPress={() => navigation.navigate('Addresses')}
              />
            </View>
          </LinearGradient>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.menuCard}>
            <MenuItem
              icon="person"
              iconColor={COLORS.primary}
              title="Edit Profile"
              subtitle="Update your personal information"
              onPress={() => navigation.navigate('EditProfile')}
            />
            <MenuDivider />
            <MenuItem
              icon="location"
              iconColor="#F59E0B"
              title="My Addresses"
              subtitle="Manage your service locations"
              onPress={() => navigation.navigate('Addresses')}
            />
            <MenuDivider />
            <MenuItem
              icon="heart"
              iconColor="#EF4444"
              title="Favorites"
              subtitle="Your saved services & providers"
              onPress={() => navigation.navigate('Favorites')}
            />
            <MenuDivider />
            <MenuItem
              icon="calendar"
              iconColor="#8B5CF6"
              title="My Bookings"
              subtitle="View and manage your bookings"
              onPress={() => navigation.navigate('Bookings')}
            />
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support & Settings</Text>
          <View style={styles.menuCard}>
            <MenuItem
              icon="help-circle"
              iconColor="#10B981"
              title="Help & Support"
              subtitle="Get help with your account"
              onPress={() => {
                Alert.alert('Help & Support', 'Coming soon!');
              }}
            />
            <MenuDivider />
            <MenuItem
              icon="settings"
              iconColor="#6B7280"
              title="Settings"
              subtitle="App preferences and settings"
              onPress={() => {
                Alert.alert('Settings', 'Coming soon!');
              }}
            />
          </View>
        </View>

        {/* Sign Out */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleSignOut}
            activeOpacity={0.7}
          >
            <View style={styles.signOutContent}>
              <Ionicons name="log-out" size={20} color={COLORS.danger} />
              <Text style={styles.signOutText}>Sign Out</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* App Version */}
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

// Quick Stat Component
const QuickStat: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}> = ({ icon, label, onPress }) => {
  return (
    <TouchableOpacity 
      style={styles.quickStatItem} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.quickStatIcon}>
        <Ionicons name={icon} size={18} color={COLORS.primary} />
      </View>
      <Text style={styles.quickStatLabel}>{label}</Text>
    </TouchableOpacity>
  );
};

// Menu Item Component
const MenuItem: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}> = ({ icon, iconColor, title, subtitle, onPress }) => {
  return (
    <TouchableOpacity 
      style={styles.menuItem} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.menuIconContainer, { backgroundColor: iconColor + '15' }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.menuContent}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={COLORS.text.light} />
    </TouchableOpacity>
  );
};

// Menu Divider Component
const MenuDivider: React.FC = () => <View style={styles.menuDivider} />;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },

  // Guest State
  guestContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  guestIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  guestTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  guestSubtitle: {
    fontSize: 15,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  guestButton: {
    borderRadius: 16,
    overflow: 'hidden',
    width: '100%',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  guestButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  guestButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Scroll Content
  scrollContent: {
    paddingBottom: Platform.OS === 'ios' ? 120 : 100,
  },

  // Profile Header
  profileHeader: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 24,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  profileHeaderGradient: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 24,
  },

  // Quick Stats
  quickStats: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
  quickStatItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  quickStatIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickStatLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
  },

  // Section
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 12,
  },

  // Menu Card
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  menuIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 13,
    color: COLORS.text.secondary,
    lineHeight: 18,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: 72,
  },

  // Sign Out Button
  signOutButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FEE2E2',
    overflow: 'hidden',
  },
  signOutContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.danger,
  },

  // Version
  versionText: {
    fontSize: 12,
    color: COLORS.text.light,
    textAlign: 'center',
    marginBottom: 24,
  },
});