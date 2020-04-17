import { TestBed } from '@angular/core/testing';

import { CsmPocLibService } from './csm-poc-lib.service';

describe('CsmPocLibService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: CsmPocLibService = TestBed.get(CsmPocLibService);
    expect(service).toBeTruthy();
  });
});
