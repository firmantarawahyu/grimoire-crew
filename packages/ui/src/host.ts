/**
 * What the shared UI needs from the page that hosts it.
 *
 * apps/web implements it for the standalone demo; apps/crew-app/ui implements it
 * with @kirocrew/app-sdk hooks. packages/ui never imports the SDK itself
 * (see .kiro/steering/architecture.md).
 */
export interface HostAdapter {
  /** Which host renders the studio. */
  readonly kind: 'web' | 'crew';
  /** Show a short, non-blocking message to the user. */
  notify(message: string, options?: { tone?: 'info' | 'success' | 'warning' | 'error' }): void;
  /** Open a chat with an agent, when the host has one (Kiro Crew). */
  openChat?(options: { agent?: string; message?: string }): void;
}
