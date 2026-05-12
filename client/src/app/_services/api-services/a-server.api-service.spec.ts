import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { A_Server_ApiService } from './a-server.api-service';

describe('| A_Server_ApiService', () => {
  let service: A_Server_ApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [A_Server_ApiService],
    });
    service = TestBed.inject(A_Server_ApiService);
  });

  it('| should be created', () => {
    expect(service).toBeTruthy();
  });

  it('| getStatus should exist and return Promise', () => {
    expect(service.getStatus).toBeTruthy();
    expect(service.getStatus()).toBeInstanceOf(Promise);
  });

  it('| getHealthz should exist and return Promise', () => {
    expect(service.getHealthz).toBeTruthy();
    expect(service.getHealthz()).toBeInstanceOf(Promise);
  });

  it('| getDashboard should exist and return Promise', () => {
    expect(service.getDashboard).toBeTruthy();
    expect(service.getDashboard()).toBeInstanceOf(Promise);
  });

  it('| postCapture should exist and return Promise', () => {
    expect(service.postCapture).toBeTruthy();
    expect(service.postCapture({ text: 'x', source: 'manual' } as never)).toBeInstanceOf(Promise);
  });

  it('| postWave should exist and return Promise', () => {
    expect(service.postWave).toBeTruthy();
    expect(service.postWave({} as never)).toBeInstanceOf(Promise);
  });

  it('| postInsight should exist and return Promise', () => {
    expect(service.postInsight).toBeTruthy();
    expect(service.postInsight({} as never)).toBeInstanceOf(Promise);
  });

  it('| dismissInsight should exist and return Promise', () => {
    expect(service.dismissInsight).toBeTruthy();
    expect(service.dismissInsight('id1')).toBeInstanceOf(Promise);
  });
});
