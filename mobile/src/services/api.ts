import { auth } from './firebase';

const BASE_URL = process.env.API_URL || 'https://benimolan.com/api';

async function getToken(): Promise<string | null> {
  const user = auth.currentUser;
  return user ? user.getIdToken() : null;
}

export async function apiGet<T>(path: string): Promise<T> {
  const token = await getToken();
  const res = await fetch(BASE_URL + path, {
    headers: token ? { Authorization: 'Bearer ' + token } : {},
  });
  return res.json();
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const token = await getToken();
  const res = await fetch(BASE_URL + path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
    },
    body: JSON.stringify(body),
  });
  return res.json();
}
