import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DailyTopicsComponent } from './daily-topics.component';

describe('DailyTopicsComponent', () => {
  let component: DailyTopicsComponent;
  let fixture: ComponentFixture<DailyTopicsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DailyTopicsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DailyTopicsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
