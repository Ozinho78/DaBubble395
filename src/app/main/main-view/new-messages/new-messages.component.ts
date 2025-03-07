import { Component, inject, OnInit } from '@angular/core';
import { User } from '../../../../models/user.model';
import { Channel } from '../../../../models/channel.model';
import { Observable } from 'rxjs';
import { FirestoreService } from '../../../../services/firestore.service';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-new-messages',
  imports: [CommonModule],
  templateUrl: './new-messages.component.html',
  styleUrl: './new-messages.component.scss'
})
export class NewMessagesComponent implements OnInit {
  users$!: Observable<User[]>;
  channels$!: Observable<Channel[]>;
  
  users: User[] = [];
  channels: Channel[] = [];

  constructor(private dataService: FirestoreService) {}

  ngOnInit() {
    this.users$ = this.dataService.users$;
    this.channels$ = this.dataService.channels$;

    // Direkter Zugriff auf die Arrays
    this.users = this.dataService.getUsers();
    this.channels = this.dataService.getChannels();
  }
}

