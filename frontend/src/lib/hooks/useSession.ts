'use client';

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setUser } from '@/store/slices/sessionSlice';
import { loadSession, saveSession, clearSession } from '@/lib/auth/tokenStore';
import { api, saveTokens, clearTokens } from '@/lib/api/apiClient';
import { mapRole } from '@/lib/mapper/mappers';
import type { User } from '@/types';

export function useSession() {
  const dispatch = useAppDispatch();
  const { user, hydrated } = useAppSelector((s) => s.session);

  useEffect(() => {
    if (!hydrated) {
      dispatch(setUser(loadSession()));
    }
  }, [hydrated, dispatch]);

  const login = async (email: string, password: string): Promise<User> => {
    // 1. Authenticate
    const authRes = await api.post<{ accessToken: string; refreshToken: string }>(
      '/auth/login',
      { email, password },
      true, // noAuth — we don't have a token yet
    );
    const { accessToken, refreshToken } = authRes.data;
    saveTokens(accessToken, refreshToken);

    // 2. Fetch user profile
    const meRes = await api.get<{
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      role: string;
    }>('/auth/me');

    const mappedUser: User = {
      id: meRes.data.id ?? (meRes.data as Record<string, unknown>)._id as string,
      name: `${meRes.data.firstName ?? ''} ${meRes.data.lastName ?? ''}`.trim() || email,
      email: meRes.data.email,
      role: mapRole(meRes.data.role),
    };

    saveSession(mappedUser);
    dispatch(setUser(mappedUser));
    return mappedUser;
  };

  const logout = () => {
    clearSession();
    clearTokens();
    dispatch(setUser(null));
  };

  return { user, hydrated, login, logout };
}
