// src/screens/profile/EditProfileScreen.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { COLORS, SIZES } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { uploadSingleImage } from '../../services/upload';
import { updateMe } from '../../services/profile';

export const EditProfileScreen: React.FC<any> = ({ navigation }) => {
  const { user } = useAuth();

  const [firstName, setFirstName] = useState(user?.first_name ?? '');
  const [lastName, setLastName] = useState(user?.last_name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');

  const [localImageUri, setLocalImageUri] = useState<string | null>(null);
  const [remoteImageUrl, setRemoteImageUrl] = useState<string | null>(user?.profile_image ?? null);

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const avatarUri = useMemo(() => {
    return localImageUri || remoteImageUrl || null;
  }, [localImageUri, remoteImageUrl]);

  const initials = useMemo(() => {
    return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase() || 'U';
  }, [firstName, lastName]);

  useEffect(() => {
    setFirstName(user?.first_name ?? '');
    setLastName(user?.last_name ?? '');
    setPhone(user?.phone ?? '');
    setRemoteImageUrl(user?.profile_image ?? null);
    setLocalImageUri(null);
  }, [user?.id]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow photo library access to pick an image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (result.canceled) return;

    const uri = result.assets?.[0]?.uri;
    if (!uri) return;

    setLocalImageUri(uri);
  };

  const uploadAvatarIfNeeded = async (): Promise<string | null> => {
    if (!localImageUri) return remoteImageUrl ?? null;

    setUploading(true);
    try {
      const uploaded = await uploadSingleImage(localImageUri);
      setRemoteImageUrl(uploaded.url);
      setLocalImageUri(null);
      return uploaded.url;
    } catch (e: any) {
      Alert.alert(
        'Upload Failed',
        e?.response?.data?.message || e?.response?.data?.error || e?.message || 'Could not upload image.'
      );
      return null;
    } finally {
      setUploading(false);
    }
  };

  const onSave = async () => {
    if (!user) {
      Alert.alert('Not Logged In', 'Please login again.');
      return;
    }

    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Required Fields', 'Please enter your first and last name.');
      return;
    }

    setSaving(true);
    try {
      const finalImageUrl = await uploadAvatarIfNeeded();
      if (localImageUri && !finalImageUrl) {
        setSaving(false);
        return;
      }

      const updatedUser = await updateMe({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim() || null,
        profile_image: finalImageUrl ?? null,
      });

      Alert.alert('Success', 'Your profile has been updated.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (e: any) {
      Alert.alert(
        'Save Failed',
        e?.response?.data?.message || e?.response?.data?.error || e?.message || 'Could not update profile.'
      );
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = useMemo(() => {
    return (
      firstName !== (user?.first_name ?? '') ||
      lastName !== (user?.last_name ?? '') ||
      phone !== (user?.phone ?? '') ||
      localImageUri !== null
    );
  }, [firstName, lastName, phone, localImageUri, user]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.headerButton}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <Text style={styles.headerSubtitle}>Update your information</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
              ) : (
                <LinearGradient
                  colors={[COLORS.primary, COLORS.secondary]}
                  style={styles.avatarPlaceholder}
                >
                  <Text style={styles.avatarText}>{initials}</Text>
                </LinearGradient>
              )}

              {/* Upload Overlay */}
              <TouchableOpacity
                style={styles.avatarOverlay}
                onPress={pickImage}
                activeOpacity={0.8}
                disabled={uploading}
              >
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.6)']}
                  style={styles.avatarOverlayGradient}
                >
                  {uploading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Ionicons name="camera" size={24} color="#FFF" />
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <Text style={styles.avatarLabel}>Profile Photo</Text>
            {uploading && (
              <Text style={styles.uploadingText}>Uploading...</Text>
            )}
            {localImageUri && !uploading && (
              <View style={styles.changeIndicator}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={styles.changeIndicatorText}>New photo selected</Text>
              </View>
            )}
          </View>

          {/* Form Fields */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Personal Information</Text>

            {/* First Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>First Name</Text>
              <View style={styles.inputContainer}>
                <View style={styles.inputIcon}>
                  <Ionicons name="person" size={18} color={COLORS.primary} />
                </View>
                <TextInput
                  value={firstName}
                  onChangeText={setFirstName}
                  style={styles.input}
                  placeholder="Enter first name"
                  placeholderTextColor={COLORS.text.light}
                />
              </View>
            </View>

            {/* Last Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Last Name</Text>
              <View style={styles.inputContainer}>
                <View style={styles.inputIcon}>
                  <Ionicons name="person" size={18} color={COLORS.primary} />
                </View>
                <TextInput
                  value={lastName}
                  onChangeText={setLastName}
                  style={styles.input}
                  placeholder="Enter last name"
                  placeholderTextColor={COLORS.text.light}
                />
              </View>
            </View>

            {/* Email (Read-only) */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={[styles.inputContainer, styles.inputDisabled]}>
                <View style={styles.inputIcon}>
                  <Ionicons name="mail" size={18} color={COLORS.text.light} />
                </View>
                <TextInput
                  value={user?.email ?? ''}
                  style={[styles.input, { color: COLORS.text.light }]}
                  editable={false}
                />
                <View style={styles.lockedBadge}>
                  <Ionicons name="lock-closed" size={12} color={COLORS.text.light} />
                </View>
              </View>
              <Text style={styles.inputHint}>Email cannot be changed</Text>
            </View>

            {/* Phone */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number (Optional)</Text>
              <View style={styles.inputContainer}>
                <View style={styles.inputIcon}>
                  <Ionicons name="call" size={18} color={COLORS.primary} />
                </View>
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  style={styles.input}
                  placeholder="Enter phone number"
                  placeholderTextColor={COLORS.text.light}
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Actions */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveButton, (!hasChanges || saving || uploading) && styles.saveButtonDisabled]}
          onPress={onSave}
          disabled={!hasChanges || saving || uploading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={(!hasChanges || saving || uploading) 
              ? ['#9CA3AF', '#6B7280'] 
              : [COLORS.primary, COLORS.secondary]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.saveButtonGradient}
          >
            {saving ? (
              <>
                <ActivityIndicator size="small" color="#FFF" />
                <Text style={styles.saveButtonText}>Saving...</Text>
              </>
            ) : (
              <>
                <Ionicons name="checkmark" size={20} color="#FFF" />
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.text.secondary,
    marginTop: 2,
  },

  // Content
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Platform.OS === 'ios' ? 180 : 150,
  },

  // Avatar Section
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  avatarOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 50,
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
    overflow: 'hidden',
  },
  avatarOverlayGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  uploadingText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 8,
  },
  changeIndicatorText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10B981',
  },

  // Form Section
  formSection: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  inputDisabled: {
    backgroundColor: '#F9FAFB',
  },
  inputIcon: {
    width: 48,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text.primary,
    paddingVertical: 16,
    paddingRight: 16,
  },
  lockedBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  inputHint: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginTop: 6,
    marginLeft: 4,
  },

  // Bottom Bar
bottomBar: {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  flexDirection: 'row',
  paddingHorizontal: 16,
  paddingTop: 16,
  paddingBottom: Platform.OS === 'ios' ? 110 : 90, // Account for tab bar height
  backgroundColor: '#FFFFFF',
  borderTopWidth: 1,
  borderTopColor: '#F3F4F6',
  gap: 12,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: -4 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 10,
},
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  saveButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  saveButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});