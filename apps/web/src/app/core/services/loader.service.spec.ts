import { TestBed } from '@angular/core/testing';

import { LoaderService } from './loader.service';

describe('LoaderService', () => {
  let service: LoaderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LoaderService);
  });

  it('should not be loading initially', () => {
    expect(service.isLoading()).toBe(false);
  });

  it('should stay loading until every show() has a matching hide()', () => {
    service.show();
    service.show();
    service.hide();

    expect(service.isLoading()).toBe(true);

    service.hide();

    expect(service.isLoading()).toBe(false);
  });

  it('should never count below zero', () => {
    service.hide();
    service.show();

    expect(service.isLoading()).toBe(true);
  });
});
