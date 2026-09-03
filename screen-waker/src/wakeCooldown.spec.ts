import { describe, expect, it } from 'vitest';

import { WakeCooldown } from './wakeCooldown.js';

describe('WakeCooldown', (): void => {
  it('allows the first wake', (): void => {
    expect(new WakeCooldown(30_000).isAllowed(1000)).toBe(true);
  });

  it('blocks until the configured duration has elapsed', (): void => {
    const cooldown: WakeCooldown = new WakeCooldown(30_000);
    cooldown.recordWake(1000);

    expect(cooldown.isAllowed(30_999)).toBe(false);
    expect(cooldown.isAllowed(31_000)).toBe(true);
  });

  it('rejects invalid durations', (): void => {
    expect((): WakeCooldown => new WakeCooldown(-1)).toThrow(/non-negative/);
  });
});
