import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-add-member',
  imports: [FormsModule, CommonModule],
  templateUrl: './add-member.component.html',
  styleUrl: './add-member.component.scss'
})
export class AddMemberComponent {
  @Input() newChannelName: string = '';
  @Output() memberModalClosed = new EventEmitter<void>();
  isOpen = true;

  closeMemberModal() {
    this.isOpen = false;
    setTimeout(() => {
      this.isOpen = true;
    }, 1000)
    this.memberModalClosed.emit();
    console.log(this.memberModalClosed);  
  }

}
