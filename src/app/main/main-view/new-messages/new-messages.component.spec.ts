import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewMessagesComponent } from './new-messages.component';

describe('NewMessagesComponent', () => {
  let component: NewMessagesComponent;
  let fixture: ComponentFixture<NewMessagesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewMessagesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewMessagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
