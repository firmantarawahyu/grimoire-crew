// Bun entry: the deploy runtime for the Mode A server (decision D-019).
// Bun starts a server from this default export. Keep every Bun-specific option here.
import { createApp, DEFAULT_HEARTBEAT_MS } from './app.ts';
import { readPort } from './config.ts';

/** Seconds. Bun closes idle connections after 10 s by default, which would drop SSE streams. */
const IDLE_TIMEOUT_SECONDS = 60;

if (IDLE_TIMEOUT_SECONDS * 1000 <= DEFAULT_HEARTBEAT_MS) {
  throw new Error('Bun idle timeout must be longer than the SSE heartbeat interval');
}

export default {
  port: readPort(process.env.PORT),
  fetch: createApp().fetch,
  idleTimeout: IDLE_TIMEOUT_SECONDS,
};
