/**
 * Resolves a media or static asset URL.
 * If the URL is already absolute (http://, https://, data:, blob:), returns it as-is.
 * Otherwise, prepends VITE_API_URL when configured.
 */
export const resolveMediaUrl = (url) => {
  if (!url) return '';
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('data:') ||
    url.startsWith('blob:')
  ) {
    return url;
  }

  const apiUrl = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return apiUrl ? `${apiUrl}${cleanPath}` : cleanPath;
};

/**
 * Resolves the WebSocket URL for real-time messaging.
 * Uses VITE_WS_URL if set, otherwise derives ws:// or wss:// from window.location.
 * Auto-corrects http:// -> ws:// and https:// -> wss:// if provided.
 */
export const resolveWsUrl = (token) => {
  let baseWs = import.meta.env.VITE_WS_URL;

  if (baseWs) {
    baseWs = baseWs.trim().replace(/\/+$/, '');
    if (baseWs.startsWith('https://')) {
      baseWs = baseWs.replace('https://', 'wss://');
    } else if (baseWs.startsWith('http://')) {
      baseWs = baseWs.replace('http://', 'ws://');
    }
  } else {
    const isHttps = window.location.protocol === 'https:';
    const protocol = isHttps ? 'wss:' : 'ws:';
    baseWs = `${protocol}//${window.location.host}`;
  }

  const encodedToken = encodeURIComponent(token || '');
  return `${baseWs}/ws/chat?token=${encodedToken}`;
};
