import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CsmPocLibComponent } from './csm-poc-lib.component';

describe('CsmPocLibComponent', () => {
  let component: CsmPocLibComponent;
  let fixture: ComponentFixture<CsmPocLibComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CsmPocLibComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CsmPocLibComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
