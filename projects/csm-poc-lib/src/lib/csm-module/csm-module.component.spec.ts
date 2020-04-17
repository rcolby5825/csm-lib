import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CsmModuleComponent } from './csm-module.component';

describe('CsmModuleComponent', () => {
  let component: CsmModuleComponent;
  let fixture: ComponentFixture<CsmModuleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CsmModuleComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CsmModuleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
