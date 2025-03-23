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
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
@Component({
  selector: 'app-devspace',
  imports: [AddChannelComponent, CommonModule, RouterModule],
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
  userChannels: Channel[] = [];
  docId: string | null = null;
  channelId: string | null = null;

  @ViewChild(AddChannelComponent) channelDialog!: AddChannelComponent;

  unsubUserNames;
  unsubChannelNames;

  constructor(
    private dataService: FirestoreService,
    private visibleService: VisibleService,
    private userService: UserService,
    public userPresence: PresenceService,
    private router: Router,
    private route: ActivatedRoute
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
      this.filterUserChannels();
    }, 750);
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

  filterUserChannels() {
    if (!this.userLoggedIn) return;
    this.userChannels = this.channels.filter(channel =>
      channel.member.includes(this.userLoggedIn)
    );
    // console.log(this.userChannels);
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
    this.filterUserChannels();
  }

  selectUserForDirectMessage(user: User) {
    this.userService.setDocIdFromDevSpace(user.docId!);
    console.log(this.docId);
    this.showComponent('directMessages');

    // 12.03.2025 - Alexander Riedel
    this.router.navigate(['/main'], { replaceUrl: true });
  }

  selectChannel(channel: any) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { channel: channel.docId },
      replaceUrl: true
    });
    this.showComponent('channel');
  }

  selectUser(user: User) {
    this.userService.setDocIdFromDevSpace(user.docId!);
    setTimeout(() => {
      console.log(this.docId);
    }, 1000);
  }

  showComponent(component: string) {
    this.visibleService.setVisibleComponent(component);

    // 12.03.2025 - Alexander Riedel
    if (component == 'newMessages') {
      this.router.navigate(['/main'], { replaceUrl: true });
    }
  }
}

