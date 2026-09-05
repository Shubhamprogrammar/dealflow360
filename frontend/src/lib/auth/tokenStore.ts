import type { User } from '@/types';

const KEY = 'dealflow360.session';

export function saveSession(user: User) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(KEY, JSON.stringify(user));
}

export function loadSession(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(KEY);
}
