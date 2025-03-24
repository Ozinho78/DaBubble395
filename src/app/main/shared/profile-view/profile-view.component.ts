import { EventEmitter, Output, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, of } from 'rxjs';
import { Router } from '@angular/router';
import { UserService } from '../../../../services/user.service';

@Component({
  selector: 'app-profile-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-view.component.html',
  styleUrls: ['./profile-view.component.scss'],
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

  constructor(private router: Router, private userService: UserService) {}

  onMouseEnterClose(): void {
    this.closeImgSrc = '/img/header-img/close-hover.png';
  }

  onMouseLeaveClose(): void {
    this.closeImgSrc = '/img/header-img/close.png';
  }

  onClose(): void {
    this.close.emit();
  }

  openDirectMessage(): void {
    if (this.userName) {
      this.userService.setDocIdFromDevSpace(this.userName.id);
      this.router.navigate(['/main'], { replaceUrl: true });
      this.close.emit();
    }
  }
}
