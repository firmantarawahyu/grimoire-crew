import { Flame } from 'lucide-react';

import { cn } from '../lib/utils.ts';

export interface GrimoireMarkProps {
  /** Optional line under the title, for example a status. */
  subtitle?: string;
  className?: string;
}

/** The GrimoireCrew brand mark: a candle flame and the name, in the display font. */
export function GrimoireMark({ subtitle, className }: GrimoireMarkProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <span
        aria-hidden="true"
        className="gc-motion flex size-10 items-center justify-center rounded-full bg-candle/15 text-candle shadow-[0_0_24px_var(--gc-candle)]"
      >
        <Flame />
      </span>
      <div className="flex flex-col">
        <span className="font-display text-xl tracking-wide text-foreground">GrimoireCrew</span>
        {subtitle ? <span className="text-sm text-muted-foreground">{subtitle}</span> : null}
      </div>
    </div>
  );
}
