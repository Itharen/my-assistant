// Spec for A_DomainEvent_DataService — Subject-based event-bus.
// Cycle 111 (safe-orthogonal spec-coverage).
//
// Pattern: d-dashboard.data-service.spec.ts (cycle 108) — pure data-service,
// no DI fixture needed (`new`-vel ok).

import { firstValueFrom } from 'rxjs';
import { take, toArray } from 'rxjs/operators';

import { A_DomainEvent_DataService, type A_DomainEvent_Interface } from './a-domain-event.data-service';

function makeEvent(overrides: Partial<A_DomainEvent_Interface> = {}): A_DomainEvent_Interface {
  return {
    topic: 'wave',
    op: 'create',
    payload: { _id: 'w1', value: 50 },
    ts: '2026-05-17T06:00:00+02:00',
    ...overrides,
  };
}

describe('A_DomainEvent_DataService', () => {

  let svc: A_DomainEvent_DataService;

  beforeEach(() => {
    svc = new A_DomainEvent_DataService();
  });

  it('events$() emits the event passed to emit()', async () => {
    const evt: A_DomainEvent_Interface = makeEvent({ topic: 'user-input', op: 'create' });
    const received: Promise<A_DomainEvent_Interface> = firstValueFrom(svc.events$().pipe(take(1)));

    svc.emit(evt);

    expect(await received).toEqual(evt);
  });

  it('delivers events to multiple independent subscribers (multicast)', async () => {
    const evt: A_DomainEvent_Interface = makeEvent({ topic: 'capture' });
    const subA: Promise<A_DomainEvent_Interface> = firstValueFrom(svc.events$().pipe(take(1)));
    const subB: Promise<A_DomainEvent_Interface> = firstValueFrom(svc.events$().pipe(take(1)));

    svc.emit(evt);

    expect(await subA).toEqual(evt);
    expect(await subB).toEqual(evt);
  });

  it('preserves emission order across multiple emits', async () => {
    const collected: Promise<A_DomainEvent_Interface[]> = firstValueFrom(
      svc.events$().pipe(take(3), toArray()),
    );
    const e1: A_DomainEvent_Interface = makeEvent({ topic: 'wave', op: 'create' });
    const e2: A_DomainEvent_Interface = makeEvent({ topic: 'wave', op: 'update' });
    const e3: A_DomainEvent_Interface = makeEvent({ topic: 'insight', op: 'delete' });

    svc.emit(e1);
    svc.emit(e2);
    svc.emit(e3);

    const out: A_DomainEvent_Interface[] = await collected;
    expect(out.length).toBe(3);
    expect(out[0].topic).toBe('wave');
    expect(out[0].op).toBe('create');
    expect(out[1].op).toBe('update');
    expect(out[2].topic).toBe('insight');
  });

  it('does not deliver past emissions to late subscribers (Subject semantics, not BehaviorSubject)', (done) => {
    svc.emit(makeEvent({ topic: 'wave' }));

    // Subscribe AFTER the emission — should NOT replay.
    let received: A_DomainEvent_Interface | null = null;
    const sub = svc.events$().subscribe((e): void => { received = e; });

    setTimeout((): void => {
      expect(received).toBeNull();
      sub.unsubscribe();
      done();
    }, 10);
  });

  it('stops delivering after the subscription is closed', () => {
    const seen: A_DomainEvent_Interface[] = [];
    const sub = svc.events$().subscribe((e): void => { seen.push(e); });

    svc.emit(makeEvent({ topic: 'wave' }));
    sub.unsubscribe();
    svc.emit(makeEvent({ topic: 'insight' }));

    expect(seen.length).toBe(1);
    expect(seen[0].topic).toBe('wave');
  });
});
