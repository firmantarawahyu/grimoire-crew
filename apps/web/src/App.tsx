import { useEffect, useState } from 'react';

import { GrimoireMark } from '@grimoire-crew/ui';

type ServerState = 'checking' | 'online' | 'offline';

const STATUS_TEXT: Record<ServerState, string> = {
  checking: 'Checking the server…',
  online: 'Server online',
  offline: 'Server offline (run pnpm --filter @grimoire-crew/server dev)',
};

/** Spec 00 shell: brand mark and server health. Spec 02 replaces it with the studio. */
export function App() {
  const [server, setServer] = useState<ServerState>('checking');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/health')
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error(String(response.status)))))
      .then((body: { status?: string }) => {
        if (!cancelled) setServer(body.status === 'ok' ? 'online' : 'offline');
      })
      .catch(() => {
        if (!cancelled) setServer('offline');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="gc-root flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <GrimoireMark subtitle="The studio opens in Spec 02." />
      <p role="status" className="text-sm text-muted-foreground">
        {STATUS_TEXT[server]}
      </p>
    </main>
  );
}
