import {
  Component,
  ElementRef,
  inject,
  Injectable,
  OnInit,
  ViewChild,
} from '@angular/core';
import { addDoc, collectionData, Firestore, query, where } from '@angular/fire/firestore';
import { collection, onSnapshot } from 'firebase/firestore';
import { User } from '../../../models/user.model';
import { Channel } from '../../../models/channel.model';
import { AddChannelComponent } from './add-channel/add-channel.component';
import { CommonModule } from '@angular/common';
import { VisibleService } from '../../../services/visible.service';
import { Observable, of, Subject } from 'rxjs';
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { UserService } from '../../../services/user.service';
import { ChatService } from '../../../services/direct-meassage.service';
import { FirestoreService } from '../../../services/firestore.service';
import { PresenceService } from '../../../services/presence.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Injectable({
  providedIn: 'root',
})
@Component({
  selector: 'app-devspace',
  imports: [CommonModule, RouterModule, FormsModule, AddChannelComponent],
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
  userLoggedIn = localStorage.getItem('user-id') || '';
  userChannels$: Observable<any[]> | null = null; // Für die automatische Firestore-Aktualisierung
  private unsubscribe$ = new Subject<void>(); // Verhindert Memory-Leaks

  userDatabase = collection(this.firestore, 'users');
  channelDatabase = collection(this.firestore, 'channels');
  users: User[] = [];
  userJson: [{}] = [{}];
  channels: Channel[] = [];
  userChannels: Channel[] = [];
  docId: string | null = null;
  channelId: string | null = null;

  @ViewChild(AddChannelComponent) channelDialog!: AddChannelComponent;

  searchInput = '';
  isSearchActive = false;
  searchType: 'user' | 'channel' | null = null;
  filteredUsers: any[] = [];
  filteredChannels: any[] = [];

  @ViewChild('searchInputRef') searchInputRef!: ElementRef;

  unsubUserNames;
  unsubChannelNames;

  constructor(
    private dataService: FirestoreService,
    private visibleService: VisibleService,
    private userService: UserService,
    public userPresence: PresenceService,
    private router: Router,
    private route: ActivatedRoute,
    private chat: ChatService
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
      // this.filterUserChannels();
    }, 1000);
  }


  subscribeToUserChannels(firestore: Firestore, userId: string): Observable<Channel[]> {
    if (!userId) return new Observable<Channel[]>(); // Falls userId fehlt, leeres Observable zurückgeben

    const channelsRef = collection(firestore, 'channels'); // Referenz zur Collection
    const userChannelsQuery = query(channelsRef, where('member', 'array-contains', userId)); // Firestore Query

    return collectionData(userChannelsQuery, { idField: 'docId' }) as Observable<Channel[]>; // Observable zurückgeben
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
    this.subscribeToUserChannels(this.firestore, this.userLoggedIn).subscribe((channels) => {
      this.userChannels = channels;
    });
    // this.loadUserChannels();
  }


  trackByIndex(index: number, item: any): number {
    return index;
  }



  onSearchInputChange(value: string) {
    this.searchInput = value;
  
    if (value.startsWith('@')) {
      this.searchType = 'user';
      this.isSearchActive = true;
      const query = value.substring(1).toLowerCase();
      this.filteredUsers = this.users.filter(user => user.name.toLowerCase().includes(query));
    } else if (value.startsWith('#')) {
      this.searchType = 'channel';
      this.isSearchActive = true;
      const query = value.substring(1).toLowerCase();
      this.filteredChannels = this.userChannels.filter(channel => channel.name.toLowerCase().includes(query));
    } else {
      this.isSearchActive = false;
      this.searchType = null;
    }
  }
  
  clearSearch() {
    this.searchInput = '';
    this.isSearchActive = false;
    this.searchType = null;
    this.filteredUsers = [];
    this.filteredChannels = [];
  }



  toggleChannelVisibility() {
    this.isChannelVisible = !this.isChannelVisible;
  }

  toggleUserVisibility() {
    this.isUserVisible = !this.isUserVisible;
  }

  ngOnDestroy(): void {
    this.unsubUserNames();
    this.unsubChannelNames();
    this.userLoggedIn = '';
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  openChannelDialog() {
    this.channelDialog.open();
  }

  async saveChannelToFirestore(channel: Channel) {
    await addDoc(this.channelDatabase, channel.toJson());
    // this.filterUserChannels();
  }

  async selectUserForDirectMessage(user: User) {
    const chatId = await this.chat.getOrCreateChat(
      this.userLoggedIn,
      user.docId!
    );
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { chat: chatId },
      replaceUrl: true,
    });
  }

  selectChannel(channel: any) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { channel: channel.docId },
      replaceUrl: true,
    });
    this.showComponent('channel');
  }

  selectNewMessage() {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { newmessage: '1' },
      replaceUrl: true,
    });
    this.showComponent('newMessages');
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
    /*if (component == 'newMessages') {
      this.router.navigate(['/main?new-messages'], { replaceUrl: true });
    }*/
  }
}










// alte Methoden
// loadUserChannels() {
//   if (!this.userLoggedIn) return;

//   // Firestore-Referenz mit Query: Nur Channels laden, in denen der User Mitglied ist
//   const channelsRef = collection(this.firestore, 'channels');
//   const userChannelsQuery = query(channelsRef, where('members', 'array-contains', this.userLoggedIn));

//   // Observable setzen (automatische Updates bei Firestore-Änderungen)
//   this.userChannels$ = collectionData(userChannelsQuery, { idField: 'id' });

//   // Falls du die Channels als normales Array brauchst:
//   this.userChannels$.pipe(takeUntil(this.unsubscribe$)).subscribe((channels) => {
//     console.log('User Channels:', channels);
//   });
// }

// filterUserChannels() {
//   if (!this.userLoggedIn) return;
//   this.userChannels = this.channels.filter((channel) =>
//     channel.member.includes(this.userLoggedIn)
//   );
//   // console.log(this.userChannels);
// }

// sortUsersByAvatar() {
//   this.users.sort((a, b) => {
//     const start = parseInt(a.avatar.match(/\d+/)?.[0] || '0', 10);
//     const end = parseInt(b.avatar.match(/\d+/)?.[0] || '0', 10);
//     return end - start; // Absteigende Sortierung
//   });
// }
