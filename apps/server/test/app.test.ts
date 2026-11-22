import { describe, expect, test } from 'vitest';

import { createApp } from '../src/app.ts';
import { readPort } from '../src/config.ts';

async function readUntil(reader: ReadableStreamDefaultReader<Uint8Array>, marker: string, timeoutMs = 2_000) {
  const decoder = new TextDecoder();
  let text = '';
  const deadline = Date.now() + timeoutMs;
  while (!text.includes(marker)) {
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${JSON.stringify(marker)}; got ${JSON.stringify(text)}`);
    const { value, done } = await reader.read();
    if (done) break;
    text += decoder.decode(value, { stream: true });
  }
  return text;
}

describe('server routes', () => {
  test('GET /api/health answers ok', async () => {
    const response = await createApp().request('/api/health');
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'ok' });
  });

  test('GET /api/events streams a ready event, then heartbeats', async () => {
    const response = await createApp({ heartbeatMs: 20 }).request('/api/events');
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toMatch(/^text\/event-stream/);

    const reader = response.body!.getReader();
    const text = await readUntil(reader, ': heartbeat');
    expect(text).toMatch(/^event: ready\ndata: \{"server":"grimoire-crew"\}\n\n/);
    await reader.cancel();
  });

  test('unknown routes answer 404', async () => {
    expect((await createApp().request('/api/nope')).status).toBe(404);
  });
});

describe('readPort', () => {
  test('uses a valid port and falls back otherwise', () => {
    expect(readPort('3000')).toBe(3000);
    expect(readPort(undefined)).toBe(8787);
    expect(readPort('not-a-port')).toBe(8787);
    expect(readPort('70000')).toBe(8787);
  });
});
