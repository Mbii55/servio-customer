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
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

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

  useEffect(() => {
    // If user changes (logout/login), refresh local state
    setFirstName(user?.first_name ?? '');
    setLastName(user?.last_name ?? '');
    setPhone(user?.phone ?? '');
    setRemoteImageUrl(user?.profile_image ?? null);
    setLocalImageUri(null);
  }, [user?.id]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo library access to pick an image.');
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
      // Expecting backend returns { url, public_id }
      setRemoteImageUrl(uploaded.url);
      setLocalImageUri(null);
      return uploaded.url;
    } catch (e: any) {
      Alert.alert(
        'Upload failed',
        e?.response?.data?.message || e?.response?.data?.error || e?.message || 'Could not upload image.'
      );
      return null;
    } finally {
      setUploading(false);
    }
  };

  const onSave = async () => {
    if (!user) {
      Alert.alert('Not logged in', 'Please login again.');
      return;
    }

    setSaving(true);
    try {
      // 1) upload image (if user picked new one)
      const finalImageUrl = await uploadAvatarIfNeeded();
      if (localImageUri && !finalImageUrl) {
        // user picked image but upload failed
        setSaving(false);
        return;
      }

      // 2) update profile on backend
      const updatedUser = await updateMe({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim() || null,
        profile_image: finalImageUrl ?? null,
      });

      // 3) update locally (IMPORTANT)
      // If your AuthContext already exposes a setter like setUser/updateUser, use it.
      // If not, simplest approach: navigate back and rely on re-fetch (/auth/me) OR add updateUser() to context.
      Alert.alert('Saved', 'Your profile has been updated.');
      navigation.goBack();
    } catch (e: any) {
      Alert.alert(
        'Save failed',
        e?.response?.data?.message || e?.response?.data?.error || e?.message || 'Could not update profile.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Edit Profile</Text>

      {/* Avatar */}
      <View style={styles.avatarWrap}>
        <View style={styles.avatarCircle}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
          ) : (
            <Ionicons name="person-outline" size={34} color={COLORS.text.light} />
          )}
        </View>

        <TouchableOpacity style={styles.avatarBtn} onPress={pickImage} activeOpacity={0.85}>
          <Ionicons name="image-outline" size={18} color={COLORS.primary} />
          <Text style={styles.avatarBtnText}>Change photo</Text>
        </TouchableOpacity>

        {uploading ? (
          <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <ActivityIndicator color={COLORS.primary} />
            <Text style={{ color: COLORS.text.secondary }}>Uploading...</Text>
          </View>
        ) : null}
      </View>

      {/* Inputs */}
      <Text style={styles.label}>First Name</Text>
      <TextInput value={firstName} onChangeText={setFirstName} style={styles.input} />

      <Text style={styles.label}>Last Name</Text>
      <TextInput value={lastName} onChangeText={setLastName} style={styles.input} />

      <Text style={styles.label}>Phone</Text>
      <TextInput
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        style={styles.input}
      />

      <TouchableOpacity
        style={[styles.saveBtn, (saving || uploading) && { opacity: 0.7 }]}
        onPress={onSave}
        disabled={saving || uploading}
        activeOpacity={0.85}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveBtnText}>Save</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

// Full screen stylesheet (same file, as you requested)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
    padding: SIZES.padding,
  },
  header: {
    fontSize: SIZES.h3,
    fontWeight: '800',
    color: COLORS.text.primary,
    marginBottom: 18,
  },

  avatarWrap: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarCircle: {
    width: 92,
    height: 92,
    borderRadius: 999,
    backgroundColor: COLORS.background.tertiary,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarBtn: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background.secondary,
  },
  avatarBtnText: {
    color: COLORS.primary,
    fontWeight: '700',
  },

  label: {
    marginTop: 10,
    marginBottom: 6,
    color: COLORS.text.secondary,
    fontSize: SIZES.small,
    fontWeight: '700',
  },
  input: {
    height: SIZES.inputHeight,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radius,
    paddingHorizontal: 12,
    fontSize: SIZES.body,
    color: COLORS.text.primary,
    backgroundColor: COLORS.background.secondary,
  },

  saveBtn: {
    marginTop: 18,
    height: SIZES.buttonHeight,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontSize: SIZES.body,
    fontWeight: '800',
  },
});
