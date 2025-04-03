import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, inject, ViewChild } from '@angular/core';
import { collection, doc, Firestore, getDoc, getDocs, query, where } from '@angular/fire/firestore';
import { debounceTime, distinctUntilChanged, Observable, of } from 'rxjs';
import { Auth, signOut } from '@angular/fire/auth';
import { ProfileDetailComponent } from './profile-detail/profile-detail.component';
import { UserService } from '../../../services/user.service';
import { PresenceService } from '../../../services/presence.service';
import { ReactiveFormsModule, FormControl, FormsModule } from '@angular/forms';
import { SearchService } from '../../../services/search.service';
import { SearchResult } from '../../../models/search-result.model';


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
    // docId: 'ktUA231gfQVPbWIyhBU8',
    docId: ''
  };

  

  @ViewChild('searchContainer') searchContainer!: ElementRef;
  searchActive = false;  

  constructor(
    private auth: Auth,
    private router: Router,
    private userService: UserService,
    private presenceService: PresenceService,
    private searchService: SearchService
  ) {
    setTimeout(() => {
      this.currentUser.docId = localStorage.getItem('user-id') || '';
    }, 1000);
    // console.log('Aktueller User:', this.currentUser);
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
        this.searchActive = true;
      } else {
        this.searchResults = [];
        this.searchActive = false;
      }
    });

    // Klick außerhalb erkennen
    document.addEventListener('click', this.handleClickOutside.bind(this));
  }

  handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
  
    if (this.searchContainer && !this.searchContainer.nativeElement.contains(target)) {
      // 🧼 Suche schließen & löschen
      this.searchActive = false;
      this.searchResults = [];
      this.searchControl.setValue('');
    }
  }

  
  async openThreadModal(thread: any): Promise<void> {
    this.selectedThreadMessages = [];
    const messagesRef = collection(this.firestore, 'messages');
  
    console.log('📥 Lade Nachrichten für Thread:', thread.threadId); // Debug
  
    const q = query(messagesRef, where('threadId', '==', thread.threadId));
    const messageSnaps = await getDocs(q);
  
    const messagesWithUserData = [];
  
    for (const docSnap of messageSnaps.docs) {
      const msgData = docSnap.data();
      const userRef = doc(this.firestore, 'users', msgData['userId']);
  
      try {
        const userSnap = await getDoc(userRef);
        const userData = userSnap.exists() ? userSnap.data() : null;
  
        messagesWithUserData.push({
          ...msgData,
          senderName: userData?.['name'] || 'Unbekannt',
          senderAvatar: userData?.['avatar'] || 'default.png'
        });
      } catch (error) {
        console.warn('❌ Fehler beim Laden des Users:', error);
        messagesWithUserData.push({
          ...msgData,
          senderName: 'Unbekannt',
          senderAvatar: 'default.png'
        });
      }
    }
  
    this.selectedThreadMessages = messagesWithUserData;
    this.selectedThreadTitle = thread.title;
    this.modalOpen = true;
  }



  async performSearch(term: string) {
    if (!term || term.length < 3) return;
  
    // Suche nur in den Threads
    // this.searchResults = await this.searchService.searchUserThreads(this.currentUser.docId, term);
    // this.searchActive = true;

    this.searchService.searchEverything(this.currentUser.docId, term)
    .then((results: SearchResult[]) => {
      this.searchResults = results;
      this.searchActive = true;
    });
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

  @HostListener('document:keydown.escape')
  onEscape() {
    this.searchActive = false;
    this.searchResults = [];
    this.searchControl.setValue('');
  }

  ngOnDestroy() {
    document.removeEventListener('click', this.handleClickOutside.bind(this));
  }
}



/*
// alte Suche nur für Threads von einem selbst erstellt
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
*/