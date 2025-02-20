import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-header',
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  menuOpen: boolean = false;
  userName!: Observable<any[]>;

  constructor(private firestore: Firestore) {}

  ngOnInit(): void {
    // Ersetze 'deineCollectionName' mit dem tatsächlichen Namen deiner Collection in Firestore
    const itemsRef = collection(this.firestore, 'users');
    this.userName = collectionData(itemsRef);
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }
}
