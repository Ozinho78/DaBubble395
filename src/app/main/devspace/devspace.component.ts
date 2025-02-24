import { Component, inject, Injectable, Input, OnInit, ViewChild } from '@angular/core';
import { addDoc, Firestore } from '@angular/fire/firestore';
import { collection, onSnapshot } from 'firebase/firestore';
import { User } from '../../models/user.model';
import { Channel } from '../../models/channel.model';
import { AddChannelComponent } from './add-channel/add-channel.component';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { VisibleService } from '../../../services/visible.service';
import { Subscription } from 'rxjs';
import { animate, state, style, transition, trigger } from '@angular/animations';

@Injectable({
  providedIn: 'root',
})
@Component({
  selector: 'app-devspace',
  imports: [AddChannelComponent, RouterLink, CommonModule],
  templateUrl: './devspace.component.html',
  styleUrl: './devspace.component.scss',
  animations: [
    trigger('fadeOut', [
      state('void', style({ opacity: 0, height: 0, overflow: 'hidden' })),
      transition(':leave', [
        animate('500ms ease-out', style({ opacity: 0, height: 0 }))
      ]),
      transition(':enter', [
        style({ opacity: 0, height: '0px' }),
        animate('500ms ease-in', style({ opacity: 1, height: '*' }))
      ])
    ])
  ]
})
export class DevspaceComponent implements OnInit {
  isVisible = true;
  private subscription!: Subscription;
  firestore: Firestore = inject(Firestore);

  userDatabase = collection(this.firestore, 'users');
  channelDatabase = collection(this.firestore, 'channels');
  users: User[] = [];
  userJson: [{}] = [{}];
  channels: Channel[] = [];


  isVisible2 = true;

  toggleElement() {
    this.isVisible2 = !this.isVisible2;
  }

  

  testData = [
    {
      password: '6Boh2tS3saxHDWswwuGX',
      avatar: 'avatar1.png',
      name: 'Steffen Hoffmann',
      mail: 'steffen.hoffmann@hotmail.com',
    },
    {
      avatar: 'avatar3.png',
      password: 'Tng55pMIXGbUfhOqkU63',
      mail: 'elise.roth@da-akademie.com',
      name: 'Elise Roth',
    },
    {
      password: '4081752b278a47a544ed7afc0d738b02',
      mail: 'sofia.mueller@offline.gov',
      name: 'Sofia Müller',
      avatar: 'avatar5.png',
    },
    {
      name: 'Noah Braun',
      mail: 'noah.braun@example.com',
      avatar: 'avatar4.png',
      password: '5f4dcc3b5aa765d61d8327deb882cf99',
    },
    {
      name: 'Frederik Beck',
      mail: 'fred.beck@email.com',
      password: 'c581a959b6972b909d6e4cec06670c08',
      avatar: 'avatar6.png',
    },
    {
      mail: 'elias.neumann@gmail.com',
      avatar: 'avatar2.png',
      password: 'zW8U5VZ5wbrb8Ng8RfKE',
      name: 'Elias Neumann',
    },
  ];

  @ViewChild(AddChannelComponent) channelDialog!: AddChannelComponent;

  unsubUserNames;
  unsubChannelNames;

  constructor(private visibleService: VisibleService) {
    this.unsubUserNames = onSnapshot(this.userDatabase, (list) => {
      list.forEach((element) => {
        // this.users[element.id] = element.data();
        let singleUser = element.data() as User;
        let str = singleUser.avatar;
        singleUser.id = parseInt(str.match(/\d+/)?.[0] || '0', 10);
        singleUser.docId = element.id;
        this.users.push(singleUser);
        // console.log(element.data());
      });
    });
    this.unsubChannelNames = onSnapshot(this.channelDatabase, (list) => {
      list.forEach((element) => {
        const singleChannel = element.data() as Channel;
        this.channels.push(singleChannel);
      });
    });
  }

  ngOnInit() {
    this.subscription = this.visibleService.visibleState$.subscribe(value => {
      this.isVisible = value;
    });
    
    // this.users.sort(
    //   (start: User, end: User) => (end?.id || 0) - (start?.id || 0)
    // );
    
    // this.users.sort((a, b) => a.avatar.localeCompare(b.avatar));

    // this.userJson.sort(
    //   (start: User, end: User) => (start?.id || 0) - (end?.id || 0)
    // );
  }

  sortUsersByAvatar() {
    this.users.sort((a, b) => {
      const start = parseInt(a.avatar.match(/\d+/)?.[0] || '0', 10);
      const end = parseInt(b.avatar.match(/\d+/)?.[0] || '0', 10);
      return end - start; // Absteigende Sortierung
    });
  }

  ngOnDestroy(): void {
    //Called once, before the instance is destroyed.
    //Add 'implements OnDestroy' to the class.
    this.unsubUserNames();
    this.unsubChannelNames();
  }

  openChannelDialog() {
    this.channelDialog.open();
  }

  async saveChannelToFirestore(channel: Channel) {
    // let newChannel = new Channel;
    // newChannel.name = channelName;
    // newChannel.description = description;
    // newChannel.creationDate = new Date();
    // await addDoc(this.channelDatabase, { name: newChannel.name, creationDate: newChannel.creationDate, description: newChannel.description });
    // await addDoc(this.channelDatabase, newChannel.toJson());
    await addDoc(this.channelDatabase, channel.toJson());
    // console.log('Channel saved:', channelName);
  }
}
