// Routes demo input to cache or live AI (Section 4.1)

import { lookupCachedResponse, type CachedResponse } from './cache';

export interface RouteResult {
  type: 'cached' | 'live';
  cached?: CachedResponse;
}

// Preset commands always go to cache. Free-text always goes to live AI.
export async function routeInteraction(
  inputType: string,
  demoType: string,
  vertical: string,
  triggerKey?: string
): Promise<RouteResult> {
  if (inputType === 'preset_command' && triggerKey) {
    const cached = await lookupCachedResponse(demoType, vertical, triggerKey);
    if (cached) {
      return { type: 'cached', cached };
    }
  }

  return { type: 'live' };
}
