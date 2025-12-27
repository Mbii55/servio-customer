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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
        <View style={styles.guestWrap}>
          <View style={styles.guestIcon}>
            <Ionicons name="person-outline" size={30} color={COLORS.primary} />
          </View>

          <Text style={styles.guestTitle}>Sign in to continue</Text>
          <Text style={styles.guestSubtitle}>
            Create an account to book services, save favorites, and track orders.
          </Text>

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => setShowAuthModal(true)}
            activeOpacity={0.9}
          >
            <Text style={styles.primaryBtnText}>Sign In / Sign Up</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </TouchableOpacity>
        </View>

        <AuthModal visible={showAuthModal} onClose={() => setShowAuthModal(false)} initialMode="login" />
      </SafeAreaView>
    );
  }

  const initials = `${user?.first_name?.[0] ?? ''}${user?.last_name?.[0] ?? ''}`.toUpperCase();
  const showAvatarImage = !!user?.profile_image && !avatarFailed;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 18 }}>
        {/* Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.headerTopRow}>
            <View style={styles.avatarWrap}>
              {showAvatarImage ? (
                <Image
                  source={{ uri: user!.profile_image! }}
                  style={styles.avatarImage}
                  resizeMode="cover"
                  onError={() => setAvatarFailed(true)}
                />
              ) : (
                <Text style={styles.avatarText}>{initials || 'U'}</Text>
              )}

              {/* edit hint badge */}
              <View style={styles.avatarBadge}>
                <Ionicons name="camera-outline" size={14} color={COLORS.text.primary} />
              </View>
            </View>

            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => navigation.navigate('EditProfile')}
              activeOpacity={0.9}
            >
              <Ionicons name="create-outline" size={18} color={COLORS.text.primary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.name} numberOfLines={1}>
            {user?.first_name} {user?.last_name}
          </Text>
          <Text style={styles.email} numberOfLines={1}>
            {user?.email}
          </Text>

          {/* Quick Actions */}
          <View style={styles.quickRow}>
            <QuickAction
              icon="heart-outline"
              label="Favorites"
              onPress={() => navigation.navigate('Favorites')}
            />
            <QuickAction
              icon="calendar-outline"
              label="Bookings"
              onPress={() => navigation.navigate('Bookings')}
            />
            <QuickAction
              icon="location-outline"
              label="Addresses"
              onPress={() => navigation.navigate('Addresses')}
            />
          </View>
        </View>

        {/* Section: Account */}
        <Text style={styles.sectionLabel}>Account</Text>
        <View style={styles.groupCard}>
          <MenuRow icon="person-outline" title="Edit Profile" onPress={() => navigation.navigate('EditProfile')} />
          <Divider />
          <MenuRow icon="location-outline" title="My Addresses" onPress={() => navigation.navigate('Addresses')} />
          <Divider />
          <MenuRow icon="heart-outline" title="Favorites" onPress={() => navigation.navigate('Favorites')} />
          <Divider />
          <MenuRow icon="calendar-outline" title="My Bookings" onPress={() => navigation.navigate('Bookings')} />
        </View>

        {/* Section: Support */}
        <Text style={styles.sectionLabel}>Support</Text>
        <View style={styles.groupCard}>
          <MenuRow icon="help-circle-outline" title="Help & Support" onPress={() => {}} />
          <Divider />
          <MenuRow icon="settings-outline" title="Settings" onPress={() => {}} />
        </View>

        {/* Danger */}
        <View style={[styles.groupCard, { marginTop: 14 }]}>
          <MenuRow
            icon="log-out-outline"
            title="Sign Out"
            onPress={handleSignOut}
            destructive
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const QuickAction: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}> = ({ icon, label, onPress }) => {
  return (
    <TouchableOpacity style={styles.quickItem} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.quickIcon}>
        <Ionicons name={icon} size={18} color={COLORS.primary} />
      </View>
      <Text style={styles.quickText}>{label}</Text>
    </TouchableOpacity>
  );
};

const MenuRow: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  onPress: () => void;
  destructive?: boolean;
}> = ({ icon, title, onPress, destructive }) => {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.rowLeft}>
        <View style={[styles.rowIconWrap, destructive && styles.rowIconWrapDanger]}>
          <Ionicons
            name={icon}
            size={18}
            color={destructive ? COLORS.danger : COLORS.text.primary}
          />
        </View>
        <Text style={[styles.rowText, destructive && { color: COLORS.danger }]}>{title}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={COLORS.text.light} />
    </TouchableOpacity>
  );
};

const Divider = () => <View style={styles.divider} />;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background.primary },

  // Guest
  guestWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingBottom: 30,
  },
  guestIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: (COLORS as any).primarySoft ?? COLORS.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: (COLORS as any).borderSoft ?? COLORS.border,
    marginBottom: 12,
  },
  guestTitle: { fontSize: 16.5, fontWeight: '900', color: COLORS.text.primary, marginTop: 4 },
  guestSubtitle: {
    marginTop: 8,
    fontSize: 13,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 14,
  },

  primaryBtn: {
    marginTop: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryBtnText: { color: '#fff', fontWeight: '900', fontSize: 13.5 },

  // Header card
  headerCard: {
    margin: SIZES.padding,
    marginTop: 8,
    borderRadius: 22,
    padding: 14,
    backgroundColor: COLORS.background.secondary,
    borderWidth: 1,
    borderColor: (COLORS as any).borderSoft ?? COLORS.border,
  },
  headerTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },

  avatarWrap: {
    width: 88,
    height: 88,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: COLORS.background.tertiary,
    borderWidth: 1,
    borderColor: (COLORS as any).borderSoft ?? COLORS.border,
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarText: { flex: 1, textAlign: 'center', textAlignVertical: 'center', fontSize: 24, fontWeight: '900', color: COLORS.text.primary },

  avatarBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },

  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  name: { marginTop: 12, fontSize: 18, fontWeight: '900', color: COLORS.text.primary },
  email: { marginTop: 4, fontSize: 12.5, fontWeight: '700', color: COLORS.text.secondary },

  quickRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  quickItem: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  quickIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: (COLORS as any).primarySoft ?? COLORS.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: (COLORS as any).borderSoft ?? COLORS.border,
  },
  quickText: { fontSize: 12.5, fontWeight: '900', color: COLORS.text.primary },

  // Sections
  sectionLabel: {
    marginTop: 6,
    marginBottom: 8,
    marginHorizontal: SIZES.padding,
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.text.secondary,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },

  groupCard: {
    marginHorizontal: SIZES.padding,
    borderRadius: 20,
    backgroundColor: COLORS.background.secondary,
    borderWidth: 1,
    borderColor: (COLORS as any).borderSoft ?? COLORS.border,
    overflow: 'hidden',
  },
  divider: {
    height: 1,
    backgroundColor: (COLORS as any).borderSoft ?? COLORS.border,
    opacity: 0.7,
    marginLeft: 56,
  },

  row: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconWrapDanger: {
    backgroundColor: 'rgba(255,59,48,0.10)',
    borderColor: 'rgba(255,59,48,0.18)',
  },
  rowText: { fontSize: 14.5, fontWeight: '900', color: COLORS.text.primary },
});
