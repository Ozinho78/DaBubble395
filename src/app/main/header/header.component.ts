import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { Observable, of, switchMap } from 'rxjs';
import { authState, Auth, signOut } from '@angular/fire/auth';
import { ProfileDetailComponent } from './profile-detail/profile-detail.component';
import { UserService } from '../../../services/user.service';

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

  constructor(
    private firestore: Firestore,
    private auth: Auth,
    private router: Router,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    // Hole die Benutzer-ID aus localStorage (diese muss vorher gespeichert worden sein)
    const userId = localStorage.getItem('user-id');
    if (userId) {
      this.userName$ = this.userService.getUserById(userId);
    } else {
      // Falls keine ID gefunden wird, zeige Standardwerte an
      this.userName$ = of({ name: 'Unbekannt', avatar: 'default.png' });
    }
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  logout(): void {
    signOut(this.auth)
      .then(() => {
        this.router.navigate(['/login']);
      })
      .catch((error) => {
        console.error('Logout-Fehler:', error);
      });
  }

  toggleProfileEdit(): void {
    this.profileEditOpen = !this.profileEditOpen;
  }

  close(): void {
    this.profileEditOpen = false;
  }

  onMouseEnterClose(): void {
    this.closeImgSrc = '/img/header-img/close-hover.png';
  }

  onMouseLeaveClose(): void {
    this.closeImgSrc = '/img/header-img/close.png';
  }
}
