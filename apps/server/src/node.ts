// Node entry: local development, tests, and judges without Bun.
import { serve } from '@hono/node-server';

import { createApp } from './app.ts';
import { readPort } from './config.ts';

const port = readPort(process.env.PORT);

serve({ fetch: createApp().fetch, port }, (info) => {
  console.log(`GrimoireCrew server listening on http://localhost:${info.port}`);
});
