import { HttpClient, provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { A_Auth_Interceptor } from './a-auth.interceptor';
import { A_StorageKey } from '../_enums/a-storage-key.enum';

describe('A_Auth_Interceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        { provide: HTTP_INTERCEPTORS, useClass: A_Auth_Interceptor, multi: true },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    localStorage.removeItem(A_StorageKey.authToken);
    httpMock.verify();
  });

  it('does not add Authorization header when no token in storage', () => {
    http.get('/x').subscribe();
    const req = httpMock.expectOne('/x');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('adds Bearer Authorization header when token is present', () => {
    localStorage.setItem(A_StorageKey.authToken, 'mytoken');
    http.get('/x').subscribe();
    const req = httpMock.expectOne('/x');
    expect(req.request.headers.get('Authorization')).toBe('Bearer mytoken');
    req.flush({});
  });
});
