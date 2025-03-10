import { EventEmitter, Output, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'app-profile-view',
  imports: [CommonModule],
  templateUrl: './profile-view.component.html',
  styleUrl: './profile-view.component.scss',
})
export class ProfileViewComponent {
  @Input() userName!: {
    id: string;
    name: string;
    avatar: string;
    email?: string;
  } | null;

  @Input() onlineStatus$: Observable<boolean> = of(false);

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
