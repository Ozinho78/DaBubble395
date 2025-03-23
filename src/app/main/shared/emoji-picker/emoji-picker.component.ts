// emoji-picker.component.ts
import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';

@Component({
  selector: 'app-emoji-picker',
  standalone: true,
  imports: [CommonModule, PickerComponent],
  templateUrl: './emoji-picker.component.html',
  styleUrls: ['./emoji-picker.component.scss']
})
export class EmojiPickerComponent {
  @Output() emojiSelected = new EventEmitter<any>();

  selectEmoji(event: any) {
    this.emojiSelected.emit(event.emoji);
  }
}