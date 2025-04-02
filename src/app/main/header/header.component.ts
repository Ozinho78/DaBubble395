import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { collection, Firestore, getDocs, query, where } from '@angular/fire/firestore';
import { combineLatest, debounceTime, distinctUntilChanged, filter, map, Observable, of, switchMap } from 'rxjs';
import { Auth, signOut } from '@angular/fire/auth';
import { ProfileDetailComponent } from './profile-detail/profile-detail.component';
import { UserService } from '../../../services/user.service';
import { PresenceService } from '../../../services/presence.service';
import { ReactiveFormsModule, FormControl, FormsModule } from '@angular/forms';

@Component({
  selector: 'app-header',
  imports: [CommonModule, ProfileDetailComponent, FormsModule, ReactiveFormsModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  menuOpen: boolean = false;
  profileEditOpen: boolean = false;
  userName$: Observable<{ name: string; avatar: string }> = of({
    name: '',
    avatar: '',
  });
  closeImgSrc: string = '/img/header-img/close.png';
  onlineStatus$: Observable<boolean> = of(false);

  firestore = inject(Firestore);
  
  searchControl = new FormControl('');
  searchResults: any[] = [];
  
  selectedThreadMessages: any[] = [];
  selectedThreadTitle: string = '';
  modalOpen = false;

  currentUser = {
    // docId: 'ktUA231gfQVPbWIyhBU8', // 🔁 Hier den echten eingeloggten User einfügen
    docId: 'ktUA231gfQVPbWIyhBU8',
  };



  constructor(
    private auth: Auth,
    private router: Router,
    private userService: UserService,
    private presenceService: PresenceService
  ) {
    console.log('Aktueller User:', this.currentUser);
  }

  ngOnInit(): void {
    const userId = localStorage.getItem('user-id');
    if (userId) {
      this.userName$ = this.userService.getUserById(userId);
      this.presenceService.setUserPresence(userId);
      this.onlineStatus$ = this.presenceService.getUserPresence(userId); // Hier onlineStatus$ setzen
    } else {
      this.userName$ = of({ name: 'Unbekannt', avatar: 'default.png' });
    }

    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      if (searchTerm && searchTerm.length >= 3) {
        this.performSearch(searchTerm);
      } else {
        this.searchResults = [];
      }
    });
  }

  async performSearch(term: string): Promise<void> {
    const threadsRef = collection(this.firestore, 'threads');
    const q = query(threadsRef, where('userId', '==', this.currentUser.docId));
    const threadSnaps = await getDocs(q);
    const results: any[] = [];
    for (const threadSnap of threadSnaps.docs) {
      const threadData = threadSnap.data();
      const threadId = threadSnap.id;
      const threadText = (threadData['thread'] ?? '').toLowerCase();
      if (threadText.includes(term.toLowerCase())) {
        results.push({
          title: threadData['thread'],
          userId: { ...threadData, docId: threadId }
        });
      }
    }
  this.searchResults = results;
  console.log('✅ Gefundene Threads:', results.length);
  }


  async openThreadModal(thread: any): Promise<void> {
    const messagesRef = collection(this.firestore, 'messages');
    const q = query(messagesRef, where('threadId', '==', thread.userId.docId));
    const messageSnaps = await getDocs(q);
  
    this.selectedThreadMessages = messageSnaps.docs.map(doc => doc.data());
    this.selectedThreadTitle = thread.title;
    this.modalOpen = true;
  }




  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  logout(): void {
    const userId = localStorage.getItem('user-id');

    if (userId) {
      this.presenceService
        .setUserOffline(userId)
        .then(() => {
          this.clearLocalStorage();
          return signOut(this.auth);
        })
        .then(() => this.navigateToLogin())
        .catch((error) => this.handleLogoutError(error));
    } else {
      this.clearLocalStorage();
      signOut(this.auth)
        .then(() => this.navigateToLogin())
        .catch((error) => this.handleLogoutError(error));
    }
  }

  private navigateToLogin(): void {
    this.router.navigate(['/login']);
  }

  private handleLogoutError(error: any): void {
    console.error('Logout-Fehler:', error);
  }

  private clearLocalStorage(): void {
    localStorage.removeItem('user-id');
    localStorage.removeItem('token');
  }

  toggleProfileEdit(): void {
    this.profileEditOpen = !this.profileEditOpen;
  }

  closeProfile(): void {
    this.profileEditOpen = false;
  }

  onMouseEnterClose(): void {
    this.closeImgSrc = '/img/header-img/close-hover.png';
  }

  onMouseLeaveClose(): void {
    this.closeImgSrc = '/img/header-img/close.png';
  }
}
