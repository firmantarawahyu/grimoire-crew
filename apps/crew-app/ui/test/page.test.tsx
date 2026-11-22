import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import GrimoireCrewPage from '../src/index.tsx';
import { stubNotify } from './stubs/app-sdk.ts';

describe('Kiro Crew page', () => {
  test('renders the brand mark and injects its styles once', () => {
    render(<GrimoireCrewPage />);
    render(<GrimoireCrewPage />);
    expect(screen.getAllByText('GrimoireCrew').length).toBeGreaterThan(0);
    expect(document.querySelectorAll('#grimoire-crew-styles')).toHaveLength(1);
  });

  test('notifies through the host SDK', () => {
    render(<GrimoireCrewPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Light the candle' }));
    expect(stubNotify).toHaveBeenCalledWith('The grimoire is listening.', { type: 'info' });
  });
});
