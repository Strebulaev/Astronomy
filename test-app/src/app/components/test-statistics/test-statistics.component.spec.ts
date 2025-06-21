import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestStatisticsComponent } from './test-statistics.component';

describe('TestStatisticsComponent', () => {
  let component: TestStatisticsComponent;
  let fixture: ComponentFixture<TestStatisticsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestStatisticsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TestStatisticsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
