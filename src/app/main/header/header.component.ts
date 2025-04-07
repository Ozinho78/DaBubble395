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
import { SearchResult } from '../../../models/search-result.model';
import { ThreadModalComponent } from './thread-modal/thread-modal.component';
import { SearchModalService } from '../../../services/search-modal.service';


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
  closeImgSrc: string = '/img/header-img/close.png';
  onlineStatus$: Observable<boolean> = of(false);

  firestore = inject(Firestore);
  
  searchControl = new FormControl('');
  searchResults: any[] = [];
  
  selectedThreadMessages: any[] = [];
  selectedThreadTitle: string = '';
  modalOpen = false;
  isLoading = false;

  currentUser = { docId: '' };

  

  @ViewChild('searchContainer') searchContainer!: ElementRef;
  searchActive = false;  

  constructor(
    private auth: Auth,
    private router: Router,
    private userService: UserService,
    private presenceService: PresenceService,
    private searchService: SearchService,
    private modalService: SearchModalService
  ) {
    setTimeout(() => {
      this.currentUser.docId = localStorage.getItem('user-id') || '';
    }, 1000);
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
