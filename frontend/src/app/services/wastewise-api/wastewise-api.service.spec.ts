import { TestBed } from '@angular/core/testing';

import { WastewiseApiService } from './wastewise-api.service';

describe('WastewiseApiService', () => {
  let service: WastewiseApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WastewiseApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
