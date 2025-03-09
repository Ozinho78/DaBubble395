import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-reactions',
  imports: [CommonModule],
  templateUrl: './reactions.component.html',
  styleUrls: ['./reactions.component.scss']
})
export class ReactionsComponent {
  @Output() emojiSelected = new EventEmitter<string>();
  @Output() closed = new EventEmitter<void>();

  emojis: string[] = [
    'thumbs-up-sign', 'thumbs-down-sign', 'ok-hand-sign', 'clapping-hands-sign',
    'slightly-smiling-face', 'smiling-face-with-heart-shaped-eyes', 'smiling-face-with-open-mouth-and-smiling-eyes', 'smiling-face-with-smiling-eyes',
    'smiling-face-with-sunglasses', 'thinking-face', 'flexed-biceps', 'waving-hand-sign',
    'fire', 'party-popper', 'rocket', 'white-heavy-check-mark'
  ];

  selectEmoji(emoji: string): void {
    debugger;
    this.emojiSelected.emit(emoji);
  }

  closeOverlay(): void {
    this.closed.emit();
  }
}