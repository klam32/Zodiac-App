import assert from 'node:assert/strict';
import test from 'node:test';
import { getSupportWebSocketUrl } from './supportWebSocket.ts';

const productionOrigin = 'https://zodiac.klam.blitz.cloud';

test('Docker same-origin API roots use the page host and secure WebSockets', () => {
  for (const root of ['', '/']) {
    assert.equal(
      getSupportWebSocketUrl(root, productionOrigin, 'test-token'),
      'wss://zodiac.klam.blitz.cloud/api/v1/ws/support?token=test-token',
    );
  }
});

test('explicit API roots retain their host, port and path prefix', () => {
  assert.equal(
    getSupportWebSocketUrl('http://localhost:2643', 'http://localhost:3000', 'test-token'),
    'ws://localhost:2643/api/v1/ws/support?token=test-token',
  );
  assert.equal(
    getSupportWebSocketUrl('https://backend.example/proxy/', productionOrigin, 'test-token'),
    'wss://backend.example/proxy/api/v1/ws/support?token=test-token',
  );
});

test('relative API paths resolve against the page origin', () => {
  assert.equal(
    getSupportWebSocketUrl('/backend', productionOrigin, 'test-token'),
    'wss://zodiac.klam.blitz.cloud/backend/api/v1/ws/support?token=test-token',
  );
});

test('token encoding cannot introduce extra query parameters', () => {
  const token = 'test+token&extra=value#fragment';
  const url = new URL(getSupportWebSocketUrl('', productionOrigin, token));
  assert.equal(url.searchParams.get('token'), token);
  assert.equal(url.searchParams.size, 1);
  assert.equal(url.hash, '');
});
