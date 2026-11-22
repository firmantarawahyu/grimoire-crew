/**
 * Types for @kirocrew/app-sdk. It is not on npm: the Crew dashboard's import map
 * serves it at runtime. Only the names GrimoireCrew uses are declared, with the
 * shapes from https://kiro.dev/docs/crew/apps/sdk/ (verified 2026-11-22).
 * Spec 05 extends this as the app starts calling the gateway.
 */
declare module '@kirocrew/app-sdk' {
  export interface AppApi {
    get<T = unknown>(path: string, init?: RequestInit): Promise<T>;
    post<T = unknown>(path: string, body?: unknown, init?: RequestInit): Promise<T>;
    put<T = unknown>(path: string, body?: unknown, init?: RequestInit): Promise<T>;
    patch<T = unknown>(path: string, body?: unknown, init?: RequestInit): Promise<T>;
    del<T = unknown>(path: string, init?: RequestInit): Promise<T>;
  }

  export interface ChatLaunchOptions {
    agent?: string;
    message?: string;
    autoSend?: boolean;
  }

  export interface Theme {
    mode: 'light' | 'dark';
    accent?: string;
    colorTheme?: string;
  }

  export function useAppApi(): AppApi;
  export function useChatLauncher(): { openChat: (options?: ChatLaunchOptions) => void };
  export function useNotify(): (text: string, options?: { type?: 'info' | 'success' | 'warning' | 'error' }) => void;
  export function useTheme(): Theme;
}
