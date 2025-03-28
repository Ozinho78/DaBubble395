import { EventEmitter, Output, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, of } from 'rxjs';
import { Router, ActivatedRoute } from '@angular/router';
import { User } from '../../../../models/user.model';
import { ChatService } from '../../../../services/direct-meassage.service';

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

  constructor(
    private chatService: ChatService,
    private router: Router,
    private route: ActivatedRoute
  ) {}
  onMouseEnterClose(): void {
    this.closeImgSrc = '/img/header-img/close-hover.png';
  }

  onMouseLeaveClose(): void {
    this.closeImgSrc = '/img/header-img/close.png';
  }

  onClose(): void {
    this.close.emit();
  }

  async openDirectMessage() {
    const targetUserId = this.getTargetUserId();
    const loggedInUserId = this.getLoggedInUserId();

    if (!targetUserId || !loggedInUserId) {
      this.handleInvalidUser();
      return;
    }

    const chatId = await this.createOrGetChat(loggedInUserId, targetUserId);
    this.navigateToChat(chatId);
    this.close.emit();
  }

  private getLoggedInUserId(): string | null {
    return localStorage.getItem('user-id');
  }

  private getTargetUserId(): string | null {
    return this.userName?.id || null;
  }

  private handleInvalidUser(): void {
    console.error('User nicht vollständig definiert');
  }

  private async createOrGetChat(
    userId1: string,
    userId2: string
  ): Promise<string> {
    return await this.chatService.getOrCreateChat(userId1, userId2);
  }

  private navigateToChat(chatId: string): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { chat: chatId },
      replaceUrl: true,
    });
  }
}
