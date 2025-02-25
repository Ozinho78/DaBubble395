import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-profile-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-detail.component.html',
  styleUrls: ['./profile-detail.component.scss'],
})
export class ProfileDetailComponent {
  @Input() userName!: Observable<any[]>;
  // Output-Event, um das Schließen der Komponente an den Parent zu signalisieren
  @Output() close = new EventEmitter<void>();

  closeImgSrc: string = '/img/header-img/close.png';

  onMouseEnterClose(): void {
    this.closeImgSrc = '/img/header-img/close-hover.png';
  }

  onMouseLeaveClose(): void {
    this.closeImgSrc = '/img/header-img/close.png';
  }

  onClose(): void {
    this.close.emit();
  }
}
