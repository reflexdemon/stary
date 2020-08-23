import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AstroListComponent } from './astro-list.component';

describe('AstroListComponent', () => {
  let component: AstroListComponent;
  let fixture: ComponentFixture<AstroListComponent>;

  beforeEach(async(() => {
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
