/**
 * Entry of the Kiro Crew bundle: the dashboard lazy-imports this module and
 * renders its default export as the GrimoireCrew page.
 */
import { useNotify } from '@kirocrew/app-sdk';

import { Button, GrimoireMark } from '@grimoire-crew/ui';

import css from './styles.css?inline';

const STYLE_ID = 'grimoire-crew-styles';

function useInjectedStyles(): void {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = css;
  document.head.appendChild(style);
}

export default function GrimoireCrewPage() {
  useInjectedStyles();
  const notify = useNotify();

  return (
    <section className="gc-root flex flex-col items-start gap-4 p-6">
      <GrimoireMark subtitle="Kiro Crew app skeleton. The studio arrives with Spec 02." />
      <Button variant="outline" onClick={() => notify('The grimoire is listening.', { type: 'info' })}>
        Light the candle
      </Button>
    </section>
  );
}
