import { TestBed } from '@angular/core/testing';

import { AstroServiceService } from './astro-service.service';

describe('AstroServiceService', () => {
  let service: AstroServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AstroServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
