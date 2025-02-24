import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reactions',
  imports: [CommonModule],
  templateUrl: './reactions.component.html',
  styleUrl: './reactions.component.scss'
})
export class ReactionsComponent {
  showEmojiOverlay: boolean = false;

  openOverlay() {
    this.showEmojiOverlay = true;
  }

  closeOverlay() {
    this.showEmojiOverlay = false;
  }

  selectEmoji(emoji: string) {
    console.log('Gewähltes Emoji:', emoji);
    // Hier kannst du den ausgewählten Emoji zurückgeben oder an den Parent senden
    this.closeOverlay();
  }
}