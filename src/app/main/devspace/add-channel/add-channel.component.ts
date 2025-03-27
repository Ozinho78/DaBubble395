import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Channel } from '../../../../models/channel.model';
import { AddMemberComponent } from './add-member/add-member.component';
import { User } from '../../../../models/user.model';

@Component({
  selector: 'app-add-channel',
  imports: [FormsModule, CommonModule, AddMemberComponent],
  templateUrl: './add-channel.component.html',
  styleUrl: './add-channel.component.scss',
})
export class AddChannelComponent {
  isOpen = false;
  openMemberInput = false;
  nameInput = '';
  descriptionInput = '';
  memberDocIds: string[] = [];
  userLoggedIn: string = '';
  @Input() usersArrayFromDevSpace: User[] = [];
  @Output() memberModalClose = new EventEmitter<void>();
  @Output() onSave = new EventEmitter<Channel>();
  
  
  // Lokale Variable zur Speicherung der Daten
  storedUsersFromDevSpace: User[] = [];

  updatedUsers: User[] = [];

  constructor(){
    setTimeout(() => {
      this.userLoggedIn = localStorage.getItem('user-id') || '';
    }, 500);
  }

  handleUsersUpdate(updatedUsers: string[]) {
    // console.log(updatedUsers);
    this.memberDocIds = updatedUsers;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['usersArrayFromDevSpace'] && changes['usersArrayFromDevSpace'].currentValue) {
      this.storedUsersFromDevSpace = [...this.usersArrayFromDevSpace]; // Erstellt eine Kopie des Arrays
    }
  }

  open() {
    this.isOpen = true;
  }

  close(event?: Event) {
    if (!event || event.target === event.currentTarget) {
      this.isOpen = false;
    }
  }

  resetInputs() {
    this.nameInput = '';
    this.descriptionInput = '';
  }

  createAndEmitNewChannel() {
    let newChannel = new Channel();
    newChannel.name = this.nameInput;
    newChannel.description = this.descriptionInput;
    // newChannel.creationDate = new Date();
    newChannel.creationDate = new Date().getTime().toString();
    newChannel.member = this.memberDocIds;
    newChannel.userId = this.userLoggedIn;
    this.onSave.emit(newChannel);
    // console.log(newChannel);
  }

  save() {
    if (this.nameInput.trim()) {
      // console.log(this.usersArrayFromDevSpace);
      this.close();
      this.openMemberInput = true;
    }
  }

  cancelMemberInput(){
    this.memberModalClose.emit();
    this.openMemberInput = false;
    this.resetInputs();
  }

  closeMemberInput() {
    this.memberModalClose.emit();
    this.openMemberInput = false;
    this.createAndEmitNewChannel();
    this.resetInputs();
  }
}
