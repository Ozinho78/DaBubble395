import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MessageInputComponent } from "../../thread/message-input/message-input.component";
import { Thread } from '../../../../models/thread.class';
import { Channel } from '../../../../models/channel.model';
import { FirestoreService } from '../../../../services/firestore.service';
import { UserService } from '../../../../services/user.service';
import { MessageService } from '../../../../services/message.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-threads',
  imports: [CommonModule, MessageInputComponent],
  templateUrl: './threads.component.html',
  styleUrl: './threads.component.scss'
})
export class ThreadsComponent implements OnInit {
  channelId!: string;
  channel!: Channel | null;
  threads: Thread[] = [];

  constructor(
    private route: ActivatedRoute,
    private firestoreService: FirestoreService,
    private userService: UserService,
    private messageService: MessageService,
    private router: Router
  ) { }

  ngOnInit() {
    this.subscribeRouteParams();
  }

  subscribeRouteParams() {
    this.route.params.subscribe(params => {
      this.channelId = params['channelId'];

      this.loadChannel();
      this.loadThreads();
    });
  }

  /*
  loadChannelId() {
    this.channelId = this.route.snapshot.paramMap.get('docId') || '';
  }
  */

  async loadChannel() {
    try {
      const channels = await this.firestoreService.getDataByDocId<Channel>('channels', this.channelId);
      this.channel = channels.length > 0 ? channels[0] : null;
    } catch (error) {
      console.error('❌ Fehler beim Laden des Channels:', error);
    }
  }

  async loadThreads() {
    try {
      const rawThreads = await this.firestoreService.getDataByField<Thread>('threads', 'channelId', this.channelId);
      this.threads = rawThreads.map(obj => new Thread(obj, this.userService, this.messageService));
    } catch (error) {
      console.error('❌ Fehler beim Laden der Threads:', error);
    }
  }

  openThread(threadId: string) {
    if (this.channelId) {
      this.router.navigate(['/channel', this.channelId, 'thread', threadId], {
        queryParamsHandling: 'merge',
        replaceUrl: true // Verhindert unnötige Neuladung
      });
    }
  }

}
