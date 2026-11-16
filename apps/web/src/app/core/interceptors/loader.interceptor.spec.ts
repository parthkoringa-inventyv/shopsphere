import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpContext, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { LoaderService } from '../services/loader.service';
import { SHOW_LOADER, loaderInterceptor } from './loader.interceptor';

describe('loaderInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let loader: LoaderService;

  const withLoader = () => ({ context: new HttpContext().set(SHOW_LOADER, true) });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([loaderInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    loader = TestBed.inject(LoaderService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should show the loader while a SHOW_LOADER request is in flight', () => {
    http.get('/data', withLoader()).subscribe();

    expect(loader.isLoading()).toBe(true);

    httpMock.expectOne('/data').flush({});

    expect(loader.isLoading()).toBe(false);
  });

  it('should hide the loader when the request fails', () => {
    http.get('/data', withLoader()).subscribe({ error: () => undefined });

    httpMock.expectOne('/data').flush(null, { status: 503, statusText: 'Service Unavailable' });

    expect(loader.isLoading()).toBe(false);
  });

  it('should hide the loader when the request is cancelled', () => {
    const subscription = http.get('/data', withLoader()).subscribe();
    const req = httpMock.expectOne('/data');

    subscription.unsubscribe();

    expect(req.cancelled).toBe(true);
    expect(loader.isLoading()).toBe(false);
  });

  it('should keep the loader visible until all concurrent requests finish', () => {
    http.get('/a', withLoader()).subscribe();
    http.get('/b', withLoader()).subscribe();

    httpMock.expectOne('/a').flush({});
    expect(loader.isLoading()).toBe(true);

    httpMock.expectOne('/b').flush({});
    expect(loader.isLoading()).toBe(false);
  });

  it('should not show the loader for requests without SHOW_LOADER', () => {
    http.get('/data').subscribe();

    expect(loader.isLoading()).toBe(false);

    httpMock.expectOne('/data').flush({});
  });
});
