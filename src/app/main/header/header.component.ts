import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, inject, ViewChild } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import { debounceTime, distinctUntilChanged, Observable, of } from 'rxjs';
import { Auth, signOut } from '@angular/fire/auth';
import { ProfileDetailComponent } from './profile-detail/profile-detail.component';
import { UserService } from '../../../services/user.service';
import { PresenceService } from '../../../services/presence.service';
import { ReactiveFormsModule, FormControl, FormsModule } from '@angular/forms';
import { SearchService } from '../../../services/search.service';
import { ThreadModalComponent } from './thread-modal/thread-modal.component';
import { SearchModalService } from '../../../services/search-modal.service';
import { DirectMessagesComponent } from '../main-view/direct-messages/direct-messages.component';
import { UserProfileService } from '../../../services/user-profile.service';


@Component({
  selector: 'app-header',
  imports: [CommonModule, ProfileDetailComponent, FormsModule, ReactiveFormsModule, ThreadModalComponent],
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
  closeImgSrc: string = 'img/header-img/close.png';
  onlineStatus$: Observable<boolean> = of(false);

  firestore = inject(Firestore);
  
  searchControl = new FormControl('');
  searchResults: any[] = [];
  
  selectedThreadMessages: any[] = [];
  selectedThreadTitle: string = '';
  modalOpen = false;
  isLoading = false;

  currentUser = { docId: '' };

  showWorkspace = false;
  showHeaderImg = true;
  
  @HostListener('document:keydown.escape')
  @HostListener('window:resize')onResize() {this.updateHeaderDisplay();}
  @ViewChild('searchDropdownRef') searchDropdownRef!: ElementRef;
  @ViewChild('searchContainer') searchContainer!: ElementRef;
  searchActive = false;  

  placeholderText: string = 'Devspace durchsuchen';

  constructor(
    private auth: Auth,
    private router: Router,
    private userService: UserService,
    private presenceService: PresenceService,
    private searchService: SearchService,
    private modalService: SearchModalService,
    private userProfileService: UserProfileService
  ) {
    setTimeout(() => {
      this.currentUser.docId = localStorage.getItem('user-id') || '';
    }, 1000);
  }

  ngOnInit(): void {
    
    const userId = localStorage.getItem('user-id');
    if (userId) {
      this.userName$ = this.userService.getLiveUserById(userId);
      this.presenceService.setUserPresence(userId);
      this.onlineStatus$ = this.presenceService.getUserPresence(userId); // Hier onlineStatus$ setzen
    } else {
      this.userName$ = of({ name: 'Unbekannt', avatar: 'default.png' });
    }

    this.searchControl.valueChanges.pipe(
      debounceTime(2000),           // ⏳ warte 2 Sekunden ohne Eingabe
      distinctUntilChanged()        // nur bei geändertem Wert
    ).subscribe(searchTerm => {
      if (searchTerm && searchTerm.length >= 3) {
        this.performSearch(searchTerm);
        this.searchActive = true;
      } else {
        this.searchResults = [];
        this.searchActive = false;
      }
    });

    this.updatePlaceholder();
    window.addEventListener('resize', this.updatePlaceholder.bind(this));

    // Klick außerhalb erkennen
    document.addEventListener('click', this.handleClickOutside.bind(this));
    document.addEventListener('touchstart', this.handleClickOutside.bind(this));

    this.router.events.subscribe(() => {
      const url = this.router.url;
      const hasChannel = url.includes('channel=');
      const hasChat = url.includes('chat=');
      const newMessage = url.includes('newmessage=');
  
      if (url === '/main' || url === '/main/') {
        this.showHeaderImg = true;
        this.showWorkspace = false;
      } else if (hasChannel || hasChat || newMessage) {
        this.showHeaderImg = false;
        this.showWorkspace = true;
      } else {
        this.showHeaderImg = true;
        this.showWorkspace = false;
      }
    });

    this.router.events.subscribe(() => {
      this.updateHeaderDisplay();
    });
  
    this.updateHeaderDisplay();
  }

  updatePlaceholder() {
    if (window.innerWidth <= 1220) {
      this.placeholderText = 'Search';
    } else {
      this.placeholderText = 'Devspace durchsuchen';
    }
  }


  handleClickOutside(event: MouseEvent | TouchEvent) {
    const target = event.target as HTMLElement;
  
    const clickedInsideContainer = this.searchContainer?.nativeElement.contains(target);
    const clickedInsideDropdown = this.searchDropdownRef?.nativeElement.contains(target);
  
    if (!clickedInsideContainer && !clickedInsideDropdown) {
      this.searchActive = false; // ⛔ nur Dropdown schließen
      // Suchfeld bleibt erhalten
    }
  }

  async openThreadModal(result: any): Promise<void> {
    this.selectedThreadMessages = [];
    if (result.type === 'thread' || result.type === 'message') {
      this.selectedThreadTitle = result.title;
      this.selectedThreadMessages = await this.modalService.loadMessagesForThread(result.threadId);
    } else if (result.type === 'direct') {
      this.selectedThreadTitle = `Direktnachricht mit ${result.otherUserName}`;
      this.selectedThreadMessages = await this.modalService.loadMessagesForChat(result.chatId);
    } else if (result.type === 'user') {
      this.selectedThreadTitle = result.name;
      this.selectedThreadMessages = [
        {
          text: result.email,
          senderName: result.name,
          senderAvatar: result.avatar
        }
      ];
    }
    this.modalOpen = true;
  }

  async performSearch(term: string) {
    if (!term || term.length < 3) return;
    // Suche nur in den Threads
    // this.searchResults = await this.searchService.searchUserThreads(this.currentUser.docId, term);
    // this.searchActive = true;

    // Suche mit Spinner
    this.isLoading = true;
    document.body.classList.add('loading');
    try {
      this.searchResults = await this.searchService.searchEverything(this.currentUser.docId, term);
      this.searchActive = true;
    } finally {
      this.isLoading = false;
      document.body.classList.remove('loading');
    }

    // Suche ohne Spinner
    // this.searchService.searchEverything(this.currentUser.docId, term)
    // .then((results: SearchResult[]) => {
    //   this.searchResults = results;
    //   this.searchActive = true;
    // });

  }


  handleSearchResultClick(result: any) {
    if ((result.type === 'thread' || result.type === 'message') && result.channelId && result.threadId) {
      this.router.navigate(['/main'], {
        queryParams: {
          channel: result.channelId,
          thread: result.threadId
        }
      });
    } else if (result.type === 'direct' && result.chatId) {
      this.router.navigate(['/main'], {
        queryParams: {
          chat: result.chatId
        }
      });
    } else if (result.type === 'user') {
      this.router.navigate(['/main'], {
        queryParams: { chat: result.userId } // optional, um DirectMessages zu aktivieren
      }).then(() => {
        // Nach Navigation -> Profil anzeigen
        setTimeout(() => {
          this.userProfileService.showUserProfile(result.userId);
        }, 500); // kleiner Delay, damit Component initialisiert wird
      });
      // this.userProfileService.showUserProfile(result.userId);    // funktioniert nur, wenn direct-messages aktiv ist
      // this.openThreadModal(result); // nur noch für Benutzerprofil
    }

    // Optional zum Resetten der Suchergebnisses
    // this.searchResults = [];
    // this.searchActive = false;
    // this.searchControl.setValue('');
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
    this.closeImgSrc = 'img/header-img/close-hover.png';
  }

  onMouseLeaveClose(): void {
    this.closeImgSrc = 'img/header-img/close.png';
  }

  onEscape() {
    this.clearSearch();
  }

  ngOnDestroy() {
    document.removeEventListener('click', this.handleClickOutside.bind(this));
    document.removeEventListener('touchstart', this.handleClickOutside.bind(this));
  }

  backToMain() {
    this.router.navigate(['/main']).then(() => {
      this.updateHeaderDisplay();
    });
  }

  clearSearch() {
    this.searchActive = false;
    this.searchResults = [];
    this.searchControl.setValue('');
  }

  updateHeaderDisplay() {
    const url = this.router.url;
    const hasChannel = url.includes('channel=');
    const hasChat = url.includes('chat=');
    const newMessage = url.includes('newmessage=');
    const screenWidth = window.innerWidth;
  
    const isSmallScreen = screenWidth <= 992;
  
    if ((url === '/main' || url === '/main/') && isSmallScreen) {
      this.showHeaderImg = true;
      this.showWorkspace = false;
    } else if ((hasChannel || hasChat || newMessage) && isSmallScreen) {
      this.showHeaderImg = false;
      this.showWorkspace = true;
    } else {
      this.showHeaderImg = true;
      this.showWorkspace = false;
    }
  }
}
