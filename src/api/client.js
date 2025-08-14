import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

const NEXT_BASE_URL = (Constants?.expoConfig?.extra?.NEXT_BASE_URL) || 'http://localhost:3000';

async function getToken() {
  try {
    return await SecureStore.getItemAsync('authToken');
  } catch {
    return null;
  }
}

export async function apiFetch(path, options = {}) {
  const token = await getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

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
