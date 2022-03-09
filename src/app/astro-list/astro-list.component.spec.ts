import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AstroListComponent } from './astro-list.component';

describe('AstroListComponent', () => {
  let component: AstroListComponent;
  let fixture: ComponentFixture<AstroListComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AstroListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AstroListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
