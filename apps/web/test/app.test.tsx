import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { App } from '../src/App.tsx';

describe('web app shell', () => {
  test('shows the brand mark and an online server', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ status: 'ok' }), { status: 200 })));
    render(<App />);
    expect(screen.getByText('GrimoireCrew')).toBeInTheDocument();
    expect(await screen.findByText('Server online')).toBeInTheDocument();
  });

  test('shows an offline server when the health check fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new Error('connection refused'))));
    render(<App />);
    expect(await screen.findByText(/Server offline/)).toBeInTheDocument();
  });
});
