import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Auth, signOut } from '@angular/fire/auth';

@Component({
  selector: 'app-header',
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  menuOpen: boolean = false;
  profileEditOpen: boolean = false;
  userName!: Observable<any[]>;
  closeImgSrc: string = '/img/header-img/close.png';

  constructor(
    private firestore: Firestore,
    private auth: Auth,
    private router: Router
  ) {}

  ngOnInit(): void {
    const itemsRef = collection(this.firestore, 'users');
    this.userName = collectionData(itemsRef);
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
    this.menuOpen = false;
    this.profileEditOpen = false;
  }

  onMouseEnterClose(): void {
    this.closeImgSrc = '/img/header-img/close-hover.png';
  }

  // Wenn die Maus das Bild verlässt: zurück zum Standardbild
  onMouseLeaveClose(): void {
    this.closeImgSrc = '/img/header-img/close.png';
  }
}
