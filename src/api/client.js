import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

// Resolve Next base URL from Expo config (supports string or {development,production})
const NEXT_EXTRA = Constants?.expoConfig?.extra?.NEXT_BASE_URL;
const NEXT_BASE_URL = (typeof NEXT_EXTRA === 'string'
  ? NEXT_EXTRA
  : (NEXT_EXTRA?.production || NEXT_EXTRA?.development)) || 'http://localhost:3000';

async function getToken() {
  try {
    return await SecureStore.getItemAsync('authToken');
  } catch {
    return null;
  }
}

export async function apiFetch(path, options = {}) {
  const token = await getToken();
  const isFormData = (typeof FormData !== 'undefined') && options?.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers || {}),
  };
  if (token && !options.noAuth) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${NEXT_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    const err = new Error('Unauthorized');
    err.status = 401;
    throw err;
  }

  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const data = await res.json();
    if (!res.ok) {
      const err = new Error(data?.error || 'Request failed');
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  if (!res.ok) {
    const err = new Error('Request failed');
    err.status = res.status;
    throw err;
  }
  return res.text();
}

export async function getMe() {
  return apiFetch('/api/user/me');
}

export async function getMyCards() {
  const list = await apiFetch('/api/cartes?user=current');
  // Optional debug to verify counts
  try {
    const dbg = await apiFetch('/api/debug-cards');
    console.log('Debug counts', dbg.counts);
  } catch {}
  if (Array.isArray(list.cards) && list.cards.length > 0) return list;
  // Fallback: some accounts may still store cards embedded in user
  try {
    const me = await getMe();
    const embedded = Array.isArray(me.user?.cards) ? me.user.cards : [];
    return { cards: embedded };
  } catch (e) {
    return list; // return original result (likely empty)
  }
}

export async function getBackgrounds() {
  // No auth to avoid CORS preflight issues on some devices/network stacks
  const res = await fetch(`${NEXT_BASE_URL}/api/backgrounds`, { method: 'GET' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.error || 'Failed to load backgrounds');
    err.status = res.status;
    throw err;
  }
  return data;
}

export async function getMyUploads() {
  return apiFetch('/api/upload');
}

export async function uploadImageFile(file) {
  // file: { uri, name, type }
  const token = await getToken();
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${NEXT_BASE_URL}/api/upload?type=image`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data?.error || 'Upload failed');
    err.status = res.status;
    throw err;
  }
  return data; // { fileUrl, dockerFileUrl }
}

export async function createCard(payload) {
  return apiFetch('/api/cartes', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateCard(cardId, payload) {
  return apiFetch(`/api/cartes/${cardId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteCard(cardId) {
  return apiFetch(`/api/cartes/${cardId}`, {
    method: 'DELETE',
  });
}

export async function getMyStats() {
  const stats = await apiFetch('/api/stats');
  try {
    // If server reports 0 cards, double-check via list endpoint and synthesize counts
    const needCards = !stats?.cards || (stats.cards.total || 0) === 0;
    const needViews = !stats?.views || (stats.views.total || 0) === 0;
    const needShares = !stats?.shares || (stats.shares.total || 0) === 0;
    const needScans = !stats?.scans || (stats.scans.total || 0) === 0;
    if (needCards || needViews || needShares || needScans) {
      const list = await getMyCards();
      const cards = Array.isArray(list?.cards) ? list.cards : [];
      if (cards.length > 0) {
        const active = cards.filter(c => !!c.isActive).length;
        const inactive = Math.max(0, cards.length - active);
        const views = cards.reduce((s, c) => s + (c?.stats?.views || 0), 0);
        const shares = cards.reduce((s, c) => s + (c?.stats?.shares || 0), 0);
        const scans = cards.reduce((s, c) => s + (c?.stats?.scans || 0), 0);
        return {
          ...stats,
          cards: needCards ? { total: cards.length, active, inactive } : stats.cards,
          views: needViews ? { total: views } : stats.views,
          shares: needShares ? { total: shares } : stats.shares,
          scans: needScans ? { total: scans } : stats.scans,
        };
      }
    }
  } catch {}
  return stats;
}
