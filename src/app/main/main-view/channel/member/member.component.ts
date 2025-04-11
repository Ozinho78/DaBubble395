import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-member',
    imports: [CommonModule],
    templateUrl: './member.component.html',
    styleUrl: './member.component.scss'
})

export class MemberComponent {
    @Input() channelIdInput!: string;
    @Output() closeModal = new EventEmitter<void>();

    isOpen = false;
    showUserList: boolean = false;

    openModal() {
        this.isOpen = true;
    }

    close(event?: Event) {
        if (!event || event.target === event.currentTarget) {
            this.isOpen = false;
            this.showUserList = false;
        }
    }
}