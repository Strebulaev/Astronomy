import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OlympiadPreparationComponent } from './olympiad-preparation.component';

describe('OlympiadPreparationComponent', () => {
  let component: OlympiadPreparationComponent;
  let fixture: ComponentFixture<OlympiadPreparationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OlympiadPreparationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OlympiadPreparationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
