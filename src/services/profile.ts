// src/services/profile.ts
import api from './api';
import { User } from '../types';

export type UpdateMeInput = {
  first_name?: string;
  last_name?: string;
  phone?: string | null;
  profile_image?: string | null;
};

/**
 * Assumes you already have GET /auth/me working (used in AuthContext)
 * We'll use PATCH /auth/me for updating.
 * If your backend route is different (ex: /profile/me), change it here.
 */
export async function updateMe(data: UpdateMeInput): Promise<User> {
  const res = await api.patch<{ user: User }>('/auth/me', data);
  return res.data.user;
}
