/** Resolve same-origin API roots before choosing the WebSocket protocol. */
export const getSupportWebSocketUrl = (
  apiRoot: string,
  pageOrigin: string,
  token: string,
): string => {
  const base = new URL(apiRoot || '/', pageOrigin);
  base.pathname = `${base.pathname.replace(/\/$/, '')}/api/v1/ws/support`;
  base.protocol = base.protocol === 'https:' ? 'wss:' : 'ws:';
  base.search = '';
  base.hash = '';
  base.searchParams.set('token', token);
  return base.toString();
};
