import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppIconsModule } from '../icons.module';

import { UserInputComponent } from './user-input.component';

describe('UserInputComponent', () => {
  let component: UserInputComponent;
  let fixture: ComponentFixture<UserInputComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [UserInputComponent],
      providers: []
    });
    fixture = TestBed.createComponent(UserInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
