import {
  Component,
  inject,
  Injectable,
  OnInit,
  ViewChild,
} from '@angular/core';
import { addDoc, Firestore } from '@angular/fire/firestore';
import { collection, onSnapshot } from 'firebase/firestore';
import { User } from '../../../models/user.model';
import { Channel } from '../../../models/channel.model';
import { AddChannelComponent } from './add-channel/add-channel.component';
import { CommonModule } from '@angular/common';
import { VisibleService } from '../../../services/visible.service';
import { Observable, of } from 'rxjs';
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { UserService } from '../../../services/user.service';
import { FirestoreService } from '../../../services/firestore.service';
import { PresenceService } from '../../../services/presence.service';

@Injectable({
  providedIn: 'root',
})
@Component({
  selector: 'app-devspace',
  imports: [AddChannelComponent, CommonModule],
  templateUrl: './devspace.component.html',
  styleUrl: './devspace.component.scss',
  animations: [
    trigger('fadeOut', [
      state('void', style({ opacity: 0, height: 0, overflow: 'hidden' })),
      transition(':leave', [
        animate('250ms ease-out', style({ opacity: 0, height: 0 })),
      ]),
      transition(':enter', [
        style({ opacity: 0, height: '0px' }),
        animate('250ms ease-in', style({ opacity: 1, height: '*' })),
      ]),
    ]),
  ],
})
export class DevspaceComponent implements OnInit {
  users$!: Observable<User[]>;
  channels$!: Observable<Channel[]>;
  onlineStatus$: Observable<boolean> = of(false);
  onlineStatus: boolean = false;
  isVisible = true;
  isChannelVisible = true;
  isUserVisible = true;
  firestore: Firestore = inject(Firestore);
  userLoggedIn: string = '';

  userDatabase = collection(this.firestore, 'users');
  channelDatabase = collection(this.firestore, 'channels');
  users: User[] = [];
  userJson: [{}] = [{}];
  channels: Channel[] = [];
  docId: string | null = null;
  channelId: string | null = null;

  @ViewChild(AddChannelComponent) channelDialog!: AddChannelComponent;

  unsubUserNames;
  unsubChannelNames;

  constructor(
    private dataService: FirestoreService,
    private visibleService: VisibleService,
    private userService: UserService,
    public userPresence: PresenceService
  ) {
    this.unsubUserNames = onSnapshot(this.userDatabase, (list) => {
      this.users = [];
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
      this.channels = [];
      list.forEach((element) => {
        const singleChannel = element.data() as Channel;
        singleChannel.docId = element.id;
        this.channels.push(singleChannel);
      });
    });
    setTimeout(() => {
      this.userLoggedIn = localStorage.getItem('user-id') || '';
    }, 500);
  }

  ngOnInit() {
    this.users$ = this.dataService.users$;
    this.channels$ = this.dataService.channels$;
    this.users = this.dataService.getUsers();
    this.channels = this.dataService.getChannels();
    this.visibleService.visibleState$.subscribe((value) => {
      this.isVisible = value;
    });
    this.userService.currentDocIdFromDevSpace.subscribe(
      (id) => (this.docId = id)
    );
    this.userService.currentChannelIdFromDevSpace.subscribe(
      (id) => (this.channelId = id)
    );
  }

  toggleChannelVisibility() {
    this.isChannelVisible = !this.isChannelVisible;
  }

  toggleUserVisibility() {
    this.isUserVisible = !this.isUserVisible;
  }

  sortUsersByAvatar() {
    this.users.sort((a, b) => {
      const start = parseInt(a.avatar.match(/\d+/)?.[0] || '0', 10);
      const end = parseInt(b.avatar.match(/\d+/)?.[0] || '0', 10);
      return end - start; // Absteigende Sortierung
    });
  }

  ngOnDestroy(): void {
    this.unsubUserNames();
    this.unsubChannelNames();
    this.userLoggedIn = '';
  }

  openChannelDialog() {
    this.channelDialog.open();
  }

  async saveChannelToFirestore(channel: Channel) {
    await addDoc(this.channelDatabase, channel.toJson());
  }

  selectUserForDirectMessage(user: User) {
    this.userService.setDocIdFromDevSpace(user.docId!);
    console.log(this.docId);
    this.showComponent('directMessages');
    this.visibleService.setThreadVisibility(false);
  }

  selectChannel(channel: Channel) {
    this.userService.setChannelIdFromDevSpace(channel.docId!);
    console.log(this.channelId);
  }

  selectUser(user: User) {
    this.userService.setDocIdFromDevSpace(user.docId!);
    setTimeout(() => {
      console.log(this.docId);
    }, 1000);
  }

  showComponent(component: string) {
    this.visibleService.setVisibleComponent(component);
  }
}

