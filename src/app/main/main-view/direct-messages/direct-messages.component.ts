import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageInputComponent } from '../../thread/message-input/message-input.component';
import { UserService } from '../../../../services/user.service';
import { PresenceService } from '../../../../services/presence.service';
import { ActivatedRoute } from '@angular/router';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'app-direct-messages',
  imports: [CommonModule, MessageInputComponent],
  templateUrl: './direct-messages.component.html',
  styleUrl: './direct-messages.component.scss',
})
export class DirectMessagesComponent implements OnInit {
  onlineStatus$: Observable<boolean> = of(false);
  user$: Observable<{ name: string; avatar: string }> = of({
    name: '',
    avatar: '',
  });

  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private presenceService: PresenceService
  ) {}

  ngOnInit(): void {
    this.userService.currentDocIdFromDevSpace.subscribe((selectedUserId) => {
      if (selectedUserId) {
        this.user$ = this.userService.getUserById(selectedUserId);
        this.onlineStatus$ =
          this.presenceService.getUserPresence(selectedUserId);
      } else {
        this.user$ = of({ name: 'Unbekannt', avatar: 'default.png' });
      }
    });
  }
}
