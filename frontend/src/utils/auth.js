import { STORAGE_KEYS } from '../constants';

const LEGACY_AUTH_KEY = 'zenstyle_auth';
const TOKEN_KEY = 'token';

function normalizeAuthPayload(authData) {
  const payload = authData?.data && typeof authData.data === 'object' ? authData.data : authData;
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  return {
    access_token: payload.access_token || payload.token || null,
    token_type: payload.token_type || 'Bearer',
    user_type: payload.user_type || null,
    user: payload.user || null,
  };
}

export function setAuth(authData) {
  const normalizedAuth = normalizeAuthPayload(authData);
  if (!normalizedAuth) return;

  localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(normalizedAuth));
  localStorage.setItem(LEGACY_AUTH_KEY, JSON.stringify(normalizedAuth));

  if (normalizedAuth.access_token) {
    localStorage.setItem(TOKEN_KEY, normalizedAuth.access_token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }

  window.dispatchEvent(new Event('zs-auth-changed'));
}

export function getAccessToken() {
  const directToken = localStorage.getItem(TOKEN_KEY);
  if (directToken) {
    return directToken;
  }

  const raw = localStorage.getItem(STORAGE_KEYS.AUTH);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    return parsed?.access_token || parsed?.token || null;
  } catch {
    return null;
  }
}

export function logout() {
  localStorage.removeItem(STORAGE_KEYS.AUTH);
  localStorage.removeItem(LEGACY_AUTH_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(STORAGE_KEYS.CART);
  sessionStorage.removeItem(STORAGE_KEYS.CART_PROMO_SESSION);
  window.dispatchEvent(new Event('zs-auth-changed'));
}
