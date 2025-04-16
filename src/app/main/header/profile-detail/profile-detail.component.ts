import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, of } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { Firestore, doc, updateDoc } from '@angular/fire/firestore';
import { PresenceService } from '../../../../services/presence.service';

@Component({
  selector: 'app-profile-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile-detail.component.html',
  styleUrls: ['./profile-detail.component.scss'],
})
export class ProfileDetailComponent {
  @Input() userName!: { name: string; avatar: string; email?: string } | null;
  @Output() close = new EventEmitter<void>();

  closeImgSrc: string = 'img/header-img/close.png';
  isEditing: boolean = false;
  updatedName: string = '';

  onlineStatus$: Observable<boolean> = of(false);

  constructor(
    private firestore: Firestore,
    private presenceService: PresenceService
  ) {}

  ngOnInit(): void {
    const userId = localStorage.getItem('user-id');
    if (userId) {
      this.onlineStatus$ = this.presenceService.getUserPresence(userId);
    }
  }

  onMouseEnterClose(): void {
    this.closeImgSrc = 'img/header-img/close-hover.png';
  }

  onMouseLeaveClose(): void {
    this.closeImgSrc = 'img/header-img/close.png';
  }

  onClose(): void {
    this.close.emit();
  }

  editUsername(): void {
    this.isEditing = true;
  }

  cancelEdit(): void {
    this.isEditing = false;
  }

  saveUsername(): void {
    if (!this.updatedName.trim()) {
      return;
    }
    const userId = localStorage.getItem('user-id');
    if (!userId) {
      console.error('User-ID nicht gefunden');
      return;
    }
    const userDocRef = doc(this.firestore, `users/${userId}`);
    updateDoc(userDocRef, { name: this.updatedName })
      .then(() => {
        if (this.userName) {
          this.userName.name = this.updatedName;
        }
        this.isEditing = false;
      })
      .catch((error) => {
        console.error('Fehler beim Aktualisieren des Usernamens: ', error);
      });
  }
}
