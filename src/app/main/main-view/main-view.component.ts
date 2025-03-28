import { Component, OnInit, ViewChild } from '@angular/core';
import { ChannelComponent } from "./channel/channel.component";
import { DirectMessagesComponent } from "./direct-messages/direct-messages.component";
import { NewMessagesComponent } from "./new-messages/new-messages.component";
import { VisibleService } from '../../../services/visible.service';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-main-view',
  imports: [ChannelComponent, DirectMessagesComponent, NewMessagesComponent, CommonModule],
  templateUrl: './main-view.component.html',
  styleUrl: './main-view.component.scss'
})
export class MainViewComponent implements OnInit {
  //@ViewChild('channelComp') channelComp!: ChannelComponent;

  visibleComponent: string = '';

  constructor(
    private visibilityService: VisibleService,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.visibilityService.visibleComponent$.subscribe(component => {
      this.visibleComponent = component;
    });

    this.route.queryParamMap.subscribe(params => {
      const channelId = params.get('channel');
      const chatId = params.get('chat');

      if (channelId) {
        this.setVisibleComponent('channel');
      } else if (chatId) {
        this.setVisibleComponent('directMessages');
      }
    });
  }

  setVisibleComponent(component: string) {
    this.visibilityService.setVisibleComponent(component);
  }

  /*handleEditRequest(event: { id: string, text: string, type: 'message' | 'thread' }) {
    if (this.channelComp?.messageInput) {
      this.channelComp.messageInput.editMessage(event.id, event.text, event.type);
    } else {
      console.warn('messageInput nicht gefunden');
    }
  }*/

}
