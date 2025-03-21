import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowChannelComponent } from './show-channel.component';

describe('ShowChannelComponent', () => {
  let component: ShowChannelComponent;
  let fixture: ComponentFixture<ShowChannelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShowChannelComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShowChannelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
