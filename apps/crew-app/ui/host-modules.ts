/**
 * Bare imports the Kiro Crew dashboard provides through its import map. The
 * bundle must import these and nothing else; everything else is bundled in.
 * Source: the first-party Crew app personal-shopper 0.1.2 (ui/vite.config.ts),
 * observed locally on 2026-11-22.
 */
export const HOST_MODULES = [
  'react',
  'react-dom',
  'react/jsx-runtime',
  'lucide-react',
  '@tanstack/react-query',
  '@kirocrew/app-sdk',
  '@kirocrew/app-sdk/ui',
] as const;
