import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewMessagesInputComponent } from './new-messages-input.component';

describe('NewMessagesInputComponent', () => {
  let component: NewMessagesInputComponent;
  let fixture: ComponentFixture<NewMessagesInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewMessagesInputComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewMessagesInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
