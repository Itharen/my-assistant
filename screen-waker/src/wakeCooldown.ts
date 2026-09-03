export class WakeCooldown {
  private lastWakeAt: number | null = null;

  public constructor(private readonly durationMs: number) {
    if (!Number.isFinite(durationMs) || durationMs < 0) {
      throw new Error('Wake cooldown duration must be a non-negative number');
    }
  }

  public isAllowed(now: number = Date.now()): boolean {
    return this.lastWakeAt === null || now - this.lastWakeAt >= this.durationMs;
  }

  public recordWake(now: number = Date.now()): void {
    this.lastWakeAt = now;
  }
}
