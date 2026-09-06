import type { User } from '@/types';

const SESSION_KEY = 'dealflow360.session';
const CUSTOMER_SESSION_KEY = 'dealflow360.customer_session';

// ---- Staff session ----

export function saveSession(user: User) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function loadSession(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(SESSION_KEY);
}

// ---- Customer session ----

export interface CustomerSession {
  customerId: string;
  companyName: string;
  accessToken: string;
}

export function saveCustomerSession(session: CustomerSession) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify(session));
}

export function loadCustomerSession(): CustomerSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(CUSTOMER_SESSION_KEY);
    return raw ? (JSON.parse(raw) as CustomerSession) : null;
  } catch {
    return null;
  }
}

export function clearCustomerSession() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(CUSTOMER_SESSION_KEY);
}
