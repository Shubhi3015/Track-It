const API_URL = import.meta.env.VITE_API_URL || '';

let accessToken = localStorage.getItem('taskflow_access');
let refreshToken = localStorage.getItem('taskflow_refresh');

export function setTokens(tokens) {
  accessToken = tokens?.accessToken || null;
  refreshToken = tokens?.refreshToken || refreshToken || null;
  if (accessToken) localStorage.setItem('taskflow_access', accessToken);
  if (refreshToken) localStorage.setItem('taskflow_refresh', refreshToken);
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem('taskflow_access');
  localStorage.removeItem('taskflow_refresh');
}

export function getRefreshToken() {
  return refreshToken;
}

async function refreshAccessToken() {
  if (!refreshToken) throw new Error('No refresh token available');
  const response = await fetch(`${API_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });
  if (!response.ok) {
    clearTokens();
    throw new Error('Session expired');
  }
  const data = await response.json();
  setTokens(data);
  return data.accessToken;
}

export async function api(path, options = {}) {
  const headers = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers || {})
  };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  let response = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (response.status === 401 && refreshToken && !path.includes('/api/auth/refresh')) {
    const nextToken = await refreshAccessToken();
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { ...headers, Authorization: `Bearer ${nextToken}` }
    });
  }

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok) throw new Error(data.message || 'Request failed');
  return data;
}
