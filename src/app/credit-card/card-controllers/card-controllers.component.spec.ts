import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CardControllersComponent } from './card-controllers.component';

describe('CardControllersComponent', () => {
  let component: CardControllersComponent;
  let fixture: ComponentFixture<CardControllersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CardControllersComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CardControllersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
