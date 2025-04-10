import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
    selector: 'app-member',
    imports: [],
    templateUrl: './member.component.html',
    styleUrl: './member.component.scss'
})

export class MemberComponent {
    @Input() channelIdInput!: string;
    @Output() closeModal = new EventEmitter<void>();

    isOpen = false; // Steuert, ob das Modal sichtbar ist

    openModal() {
        this.isOpen = true;
    }
}