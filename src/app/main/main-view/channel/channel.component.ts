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
  selector: 'app-channel',
  imports: [CommonModule, MessageInputComponent],
  templateUrl: './channel.component.html',
  styleUrl: './channel.component.scss'
})
export class ChannelComponent implements OnInit {
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
    this.route.queryParamMap.subscribe(params => {
      this.channelId = params.get('channel') || '';

      if (this.channelId) {
        this.loadChannel();
        this.loadThreads();
      }
    });
  }

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
    this.router.navigate([], {
      queryParams: { channel: this.channelId, thread: threadId },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

}
