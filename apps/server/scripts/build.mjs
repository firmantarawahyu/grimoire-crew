// Bundles each server entry into one ES module file (decision D-019).
import { build } from 'esbuild';

const shared = {
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  logLevel: 'info',
  legalComments: 'none',
};

await build({ ...shared, entryPoints: ['src/node.ts'], outfile: 'dist/server.node.mjs' });
await build({ ...shared, entryPoints: ['src/bun.ts'], outfile: 'dist/server.bun.mjs' });
