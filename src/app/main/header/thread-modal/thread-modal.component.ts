import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-thread-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './thread-modal.component.html',
  styleUrl: './thread-modal.component.scss'
})
export class ThreadModalComponent {
  @Input() title: string = '';
  @Input() messages: any[] = [];
  @Output() close = new EventEmitter<void>();

  onClose() {
    this.close.emit();
  }

}
