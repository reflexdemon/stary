import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TimelineViewComponent } from './timeline-view.component';

describe('TimelineViewComponent', () => {
  let component: TimelineViewComponent;
  let fixture: ComponentFixture<TimelineViewComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TimelineViewComponent]
    });
    fixture = TestBed.createComponent(TimelineViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
