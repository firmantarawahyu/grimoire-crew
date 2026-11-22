/**
 * Test stand-in for the host's @kirocrew/app-sdk. Only the names the bundle
 * uses. `stubNotify` is a test control; the real module has no such export.
 */
import { vi } from 'vitest';

import type { AppApi, ChatLaunchOptions, Theme } from '@kirocrew/app-sdk';

export const stubNotify = vi.fn<(text: string, options?: { type?: string }) => void>();

const unstubbed = () => Promise.reject(new Error('stub app-sdk: no API in this test'));

export function useAppApi(): AppApi {
  return { get: unstubbed, post: unstubbed, put: unstubbed, patch: unstubbed, del: unstubbed };
}

export function useChatLauncher(): { openChat: (options?: ChatLaunchOptions) => void } {
  return { openChat: vi.fn() };
}

export function useNotify() {
  return stubNotify;
}

export function useTheme(): Theme {
  return { mode: 'dark' };
}
