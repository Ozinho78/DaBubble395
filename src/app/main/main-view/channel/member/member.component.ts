import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddUserComponent } from '../add-user/add-user.component';

@Component({
    selector: 'app-member',
    imports: [CommonModule],
    templateUrl: './member.component.html',
    styleUrl: './member.component.scss'
})

export class MemberComponent {
    @ViewChild(AddUserComponent) modalAddUser!: AddUserComponent;

    @Input() channelIdInput!: string;
    @Output() closeModal = new EventEmitter<void>();

    isOpen = false;
    showUserList: boolean = false;
    channelId!: string;
    selectedChannelId: string = '';

    openModal() {
        this.isOpen = true;
    }

    close(event?: Event) {
        if (!event || event.target === event.currentTarget) {
            this.isOpen = false;
            this.showUserList = false;
        }
    }

    openModalAddUser() {
        // tbc
        this.modalAddUser.openModal();
    }
}