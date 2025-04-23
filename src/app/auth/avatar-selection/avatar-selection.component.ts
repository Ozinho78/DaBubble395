import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-avatar-selection',
  imports: [CommonModule, RouterLink],
  templateUrl: './avatar-selection.component.html',
  styleUrl: './avatar-selection.component.scss'
})
export class AvatarSelectionComponent {

  showSuccessMsg = false;

  avatars = [
    { name: 'avatar1', src: 'img/avatar/avatar1.png' },
    { name: 'avatar2', src: 'img/avatar/avatar2.png' },
    { name: 'avatar3', src: 'img/avatar/avatar3.png' },
    { name: 'avatar4', src: 'img/avatar/avatar4.png' },
    { name: 'avatar5', src: 'img/avatar/avatar5.png' },
    { name: 'avatar6', src: 'img/avatar/avatar6.png' }
  ];

  selectedAvatar: any = { name: 'avatar_dummy', src: 'img/avatar_dummy.png' };
  userData: any = {};

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.userData = this.authService.getUserData();
  }

  navigateToReg() {
    this.router.navigate(['/register']);
  }

  selectAvatar(avatar: any) {
    this.selectedAvatar = avatar;
  }

  async accept() {
    if (this.selectedAvatar.src) {
      const avatarFilename = this.selectedAvatar.src.split('/').pop() || 'default.png';

      this.authService.storeUserData(
        this.userData.name,
        this.userData.email,
        this.userData.password,
        avatarFilename
    );

      try {
        await this.authService.registerUser(avatarFilename);
        this.showSuccessMsg = true;
        setTimeout(() => {
          this.showSuccessMsg = false;
          this.router.navigate(['/main']);
        }, 2000);
      } catch (error) {
        console.error("Fehler bei der Registrierung:", error);
      }
    } else {
      console.error("Kein Avatar ausgewählt!");
    }
  }
  
}
