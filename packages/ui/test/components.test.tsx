import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import { Button, GrimoireMark, cn } from '../src/index.ts';

describe('@grimoire-crew/ui skeleton', () => {
  test('GrimoireMark shows the name and an optional subtitle', () => {
    render(<GrimoireMark subtitle="Day 1 skeleton" />);
    expect(screen.getByText('GrimoireCrew')).toBeInTheDocument();
    expect(screen.getByText('Day 1 skeleton')).toBeInTheDocument();
  });

  test('Button renders a shadcn button with its variant', () => {
    render(<Button variant="outline">Cast</Button>);
    const button = screen.getByRole('button', { name: 'Cast' });
    expect(button).toHaveAttribute('data-variant', 'outline');
  });

  test('cn resolves conflicting Tailwind classes', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });
});
