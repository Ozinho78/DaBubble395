import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, state, style, animate, transition, sequence } from '@angular/animations';
import { AnimationEvent } from '@angular/animations';
import { Output, EventEmitter } from '@angular/core';

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
    ]),
    trigger('shrinkToCorner', [
      state('center', style({
        transform: 'translate(0, 0) scale(1)'
      })),
      state('corner', style({
        transform: 'translate(calc(-30vw - 70px), calc(-35vh - 50px)) scale(0.45)'
      })),
      transition('center => corner', [
        animate('700ms cubic-bezier(0.8,0,0.2,1)')
      ])
    ]),
    trigger('fadeBg', [
      state('visible', style({ opacity: 1 })),
      state('hidden', style({ opacity: 0 })),
      transition('visible => hidden', [
        animate('500ms ease-in')
      ])
    ])
  ]
})

export class IntroComponent implements OnInit {
  @Output() introFinished = new EventEmitter<void>();

  logoState = 'center';
  showLogoText = false;
  animateOut = false;
  shrinkState = 'center';
  bgFadeState = 'visible';

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

  onTextSlideDone(event: AnimationEvent) {
    if (event.toState === 'visible') {
      this.shrinkAndFadeOut();
    }
  }

  shrinkAndFadeOut() {
    this.shrinkState = 'corner';
    setTimeout(() => {
      this.bgFadeState = 'hidden';
      setTimeout(() => {
        this.introFinished.emit();
      }, 500);
    }, 800);
  }
}
