import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { Observable, of, switchMap } from 'rxjs';
import { authState, Auth, signOut } from '@angular/fire/auth';
import { ProfileDetailComponent } from './profile-detail/profile-detail.component';
import { UserService } from '../../../services/user.service';
import { PresenceService } from '../../../services/presence.service';

@Component({
  selector: 'app-header',
  imports: [CommonModule, ProfileDetailComponent],
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

  constructor(
    private firestore: Firestore,
    private auth: Auth,
    private router: Router,
    private userService: UserService,
    private presenceService: PresenceService
  ) {}

  ngOnInit(): void {
    const userId = localStorage.getItem('user-id');
    if (userId) {
      this.userName$ = this.userService.getUserById(userId);
      this.presenceService.setUserPresence(userId);
      this.onlineStatus$ = this.presenceService.getUserPresence(userId); // Hier onlineStatus$ setzen
    } else {
      this.userName$ = of({ name: 'Unbekannt', avatar: 'default.png' });
    }
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  logout(): void {
    const userId = localStorage.getItem('user-id');
    if (userId) {
      this.presenceService
        .setUserOffline(userId)
        .then(() => signOut(this.auth))
        .then(() => {
          this.router.navigate(['/login']);
        })
        .catch((error) => {
          console.error('Logout-Fehler:', error);
        });
    } else {
      // Falls keine User-ID vorhanden ist, einfach signOut
      signOut(this.auth)
        .then(() => this.router.navigate(['/login']))
        .catch((error) => console.error('Logout-Fehler:', error));
    }
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
