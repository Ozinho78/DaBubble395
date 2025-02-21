import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-avatar-selection',
  imports: [CommonModule],
  templateUrl: './avatar-selection.component.html',
  styleUrl: './avatar-selection.component.scss'
})
export class AvatarSelectionComponent {

  avatars = [
    { name: 'avatar1', src: '/img/avatar/avatar1.png' },
    { name: 'avatar2', src: '/img/avatar/avatar2.png' },
    { name: 'avatar3', src: '/img/avatar/avatar3.png' },
    { name: 'avatar4', src: '/img/avatar/avatar4.png' },
    { name: 'avatar5', src: '/img/avatar/avatar5.png' },
    { name: 'avatar6', src: '/img/avatar/avatar6.png' }
  ];

  selectedAvatar: any = { name: 'avatar_dummy', src: '/img/avatar_dummy.png' };

  constructor(private router: Router) {}

  ngOnInit() {}

  navigateToReg() {
    this.router.navigate(['/register']);
  }

  selectAvatar(avatar: any) {
    this.selectedAvatar = avatar;
  }

  accept() {
    console.log('accept');
  }
}
