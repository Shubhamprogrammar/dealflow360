'use client';

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setUser } from '@/store/slices/sessionSlice';
import { loadSession, saveSession, clearSession } from '@/lib/auth/tokenStore';
import type { User } from '@/types';

export function useSession() {
  const dispatch = useAppDispatch();
  const { user, hydrated } = useAppSelector((s) => s.session);

  useEffect(() => {
    if (!hydrated) {
      dispatch(setUser(loadSession()));
    }
  }, [hydrated, dispatch]);

  const login = (u: User) => {
    saveSession(u);
    dispatch(setUser(u));
  };

  const logout = () => {
    clearSession();
    dispatch(setUser(null));
  };

  return { user, hydrated, login, logout };
}
