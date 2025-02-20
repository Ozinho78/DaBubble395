import { Component, OnInit } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import { ThreadService } from '../../../services/thread.service';
import { Observable, map } from 'rxjs';
import { Message } from '../../../models/message.class';
import { UserService } from '../../../services/user.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-threads',
  imports: [CommonModule],
  templateUrl: './threads.component.html',
  styleUrl: './threads.component.scss'
})
export class ThreadsComponent implements OnInit {
  messages$!: Observable<Message[]>;
  userCache: Map<string, Observable<string>> = new Map(); // Speichert Usernamen

  constructor(
    private firestore: Firestore,
    private threadService: ThreadService,
    private userService: UserService
  ) {}

  ngOnInit() {
    const threadId = '6DGHEdX29kIHBFTtGrSr'; // Testweise, später dynamisch setzen
    this.messages$ = this.threadService.getMessages(threadId);
  }

  getUserName(userId: string): Observable<string> {
    if (!this.userCache.has(userId)) {
      const userName$ = this.userService.getUserById(userId);
      this.userCache.set(userId, userName$);
    }
    return this.userCache.get(userId)!;
  }
}
