import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { A_Server_ApiService } from './a-server.api-service';
import type { A_ServerEnvelope, A_StatusSnapshot } from '../../_models/server-envelope.interface';

describe('A_Server_ApiService', () => {
  let service: A_Server_ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [A_Server_ApiService],
    });
    service = TestBed.inject(A_Server_ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('unwraps a successful /status envelope', (done) => {
    const status: A_StatusSnapshot = {
      serverTime: '2026-05-08T10:00:00Z',
      uptimeSeconds: 42,
      ticksToday: 3,
      latestTick: null,
      activity: { latestSample: null, isAfk: false, isLikelyAsleep: false },
      recentActions: [],
    };
    const env: A_ServerEnvelope<A_StatusSnapshot> = {
      ok: true,
      action: 'status',
      requestId: 'r1',
      elapsedMs: 1,
      result: status,
    };
    service.getStatus().subscribe((v) => {
      expect(v).toEqual(status);
      done();
    });
    const req = httpMock.expectOne('http://127.0.0.1:39245/status');
    expect(req.request.method).toBe('GET');
    req.flush(env);
  });

  it('throws on a failed envelope', (done) => {
    const env: A_ServerEnvelope<A_StatusSnapshot> = {
      ok: false,
      action: 'status',
      requestId: 'r1',
      elapsedMs: 1,
      error: { code: 'E_RUNTIME', message: 'kaboom' },
    };
    service.getStatus().subscribe({
      next: () => done.fail('should have errored'),
      error: (err) => {
        expect((err as Error).message).toContain('E_RUNTIME');
        done();
      },
    });
    httpMock.expectOne('http://127.0.0.1:39245/status').flush(env);
  });
});
