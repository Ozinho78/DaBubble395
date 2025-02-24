import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';

import { Thread } from '../../../../models/thread.class';
import { UserService } from '../../../../services/user.service';


@Component({
  selector: 'app-thread-message',
  imports: [CommonModule],
  templateUrl: './thread-message.component.html',
  styleUrls: ['../message/message.component.scss'],
  encapsulation: ViewEncapsulation.None

})
export class ThreadMessageComponent implements OnInit {
  @Input() thread!: Thread;
  userData$!: Observable<{ name: string, avatar: string }>;
  currentUserId: string = 'qdWWqOADh6O1FkGpHlTr'; // Hier später dynamisch über AuthService

  constructor(private userService: UserService) { }

  ngOnInit(): void {
    this.userData$ = this.userService.getUserById(this.thread.userId);
  }
}
