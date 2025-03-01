import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { User } from '../../../../../models/user.model';


@Component({
  selector: 'app-add-member',
  imports: [FormsModule, CommonModule],
  templateUrl: './add-member.component.html',
  styleUrl: './add-member.component.scss',
})
export class AddMemberComponent {
  @Input() newChannelName: string = '';
  @Input() usersArrayFromAddChannel: User[] = [];
  @Output() memberModalClosed = new EventEmitter<void>();
  @Output() usersUpdated = new EventEmitter<string[]>();

  selectedOption: string = ''; // Hier wird die ausgewählte Option gespeichert

  // Lokale Variable zur Speicherung der Daten
  storedUsersFromAddChannel: User[] = [];
  selectedUsersDocId: string[] = [];


  constructor() {
    // this.storedUsersFromAddChannel = this.usersArrayFromAddChannel;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['usersArrayFromAddChannel'] && changes['usersArrayFromAddChannel'].currentValue) {
      this.storedUsersFromAddChannel = [...changes['usersArrayFromAddChannel'].currentValue];
    }
  }

  
  closeMemberModal() {
    // this.isOpen = false;
    // setTimeout(() => {
    //   this.isOpen = true;
    // }, 1000)
    this.memberModalClosed.emit();
    // console.log(this.memberModalClosed);
  }

  selectAllUsers(){
    const arrLength = this.storedUsersFromAddChannel.length;
    for (let i = 0; i < arrLength; i++) {
      this.selectedUsersDocId.push(this.storedUsersFromAddChannel[i].docId || '');
    }
  }

  submitData() {
    // console.log(this.newChannelName);
    if(this.selectedOption == '1'){
      const updatedUsers = this.selectedUsersDocId;
      this.selectAllUsers();
      // console.log(this.selectedUsersDocId);
      this.usersUpdated.emit(updatedUsers);
    }
    // console.log(this.usersArrayFromAddChannel);
    this.closeMemberModal();
  }

}
