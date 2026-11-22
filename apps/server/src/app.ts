import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';

export interface AppOptions {
  /** Interval between SSE heartbeat comments. Must stay below the runtime's idle timeout. */
  heartbeatMs?: number;
}

export const DEFAULT_HEARTBEAT_MS = 15_000;

/**
 * Runtime-neutral Hono app (decision D-019): web-standard APIs only, so the
 * same routes run on Node (src/node.ts) and Bun (src/bun.ts). Spec 04 adds the
 * agent runner and telemetry events.
 */
export function createApp({ heartbeatMs = DEFAULT_HEARTBEAT_MS }: AppOptions = {}) {
  const app = new Hono();

  app.get('/api/health', (c) => c.json({ status: 'ok' }));

  app.get('/api/events', (c) =>
    streamSSE(c, async (stream) => {
      await stream.writeSSE({ event: 'ready', data: JSON.stringify({ server: 'grimoire-crew' }) });
      while (!stream.aborted) {
        await stream.sleep(heartbeatMs);
        if (stream.aborted) break;
        // An SSE comment line: keeps proxies and the runtime from closing an idle stream.
        await stream.write(': heartbeat\n\n');
      }
    }),
  );

  return app;
}
