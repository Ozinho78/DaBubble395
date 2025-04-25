import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, state, style, animate, transition, sequence } from '@angular/animations';
import { AnimationEvent } from '@angular/animations';

@Component({
  selector: 'app-intro',
  imports: [CommonModule],
  templateUrl: './intro.component.html',
  styleUrls: ['./intro.component.scss', '../auth-resp.scss', '../auth.component.scss'],
  animations: [
    trigger('slideLogo', [
      state('center', style({ transform: 'translateX(120px)' })),
      state('left', style({ transform: 'translateX(0)' })),
      transition('center => left', [
        animate('700ms cubic-bezier(0.8,0,0.2,1)')
      ])
    ]),
    trigger('slideText', [
      state('hidden', style({ opacity: 0, transform: 'translateX(-600px)' })),
      state('visible', style({ opacity: 1, transform: 'translateX(0)' })),
      transition('hidden => visible', [
        animate('1500ms 100ms cubic-bezier(0.8,0,0.2,1)')
      ])
    ])
  ]
})
export class IntroComponent implements OnInit {

  logoState = 'center';
  showLogoText = false;
  animateOut = false;

  constructor() {

  }

  ngOnInit() {
    setTimeout(() => {
      this.logoState = 'left';
    }, 1000);
  }

  onLogoSlideDone(event: AnimationEvent) {
    if (event.toState === 'left') {
      this.showLogoText = true;
    }
  }
}
