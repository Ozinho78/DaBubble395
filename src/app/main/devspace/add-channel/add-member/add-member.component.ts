import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { User } from '../../../../../models/user.model';
import { Observable } from 'rxjs';
import { Channel } from '../../../../../models/channel.model';
import { FirestoreService } from '../../../../../services/firestore.service';


@Component({
  selector: 'app-add-member',
  imports: [FormsModule, CommonModule],
  templateUrl: './add-member.component.html',
  styleUrl: './add-member.component.scss',
})
export class AddMemberComponent implements OnInit {
  users$!: Observable<User[]>;
  channels$!: Observable<Channel[]>;
  @Input() newChannelName: string = '';
  @Input() usersArrayFromAddChannel: User[] = [];
  @Output() memberModalClosed = new EventEmitter<void>();
  @Output() cancelMemberInputModal = new EventEmitter<void>();
  @Output() usersUpdated = new EventEmitter<string[]>();

  selectedOption: number = 0;
  // selectedOption: string = '';
  searchTerm: string = '';

  // Lokale Variablen zur Speicherung der Daten
  storedUsersFromAddChannel: User[] = [];
  selectedUsersDocId: string[] = [];
  selectedUsers: User[] = [];

  users: User[] = [];
  channels: Channel[] = [];


  constructor(private dataService: FirestoreService) {}

  ngOnInit(): void {
    this.users$ = this.dataService.users$;
    this.channels$ = this.dataService.channels$;
    this.users = this.dataService.getUsers();
    // this.channels = this.dataService.getChannels(); 
    this.storedUsersFromAddChannel = this.users;

  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['usersArrayFromAddChannel'] && changes['usersArrayFromAddChannel'].currentValue) {
      this.storedUsersFromAddChannel = [...changes['usersArrayFromAddChannel'].currentValue];
    }
    // if (changes['users'] && changes['users'].currentValue) {
    //   this.storedUsersFromAddChannel = [...changes['users'].currentValue];
    // }
  }

  get filteredUsers(): User[] {
    return this.usersArrayFromAddChannel.filter(user =>
      user.name.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
    // return this.users.filter(user =>
    //   user.name.toLowerCase().includes(this.searchTerm.toLowerCase())
    // );
  }

  selectUser(user: User): void {
    if (!this.selectedUsers.includes(user)) {
      this.selectedUsers.push(user);
    }
  }

  removeUser(user: User): void {
    this.selectedUsers = this.selectedUsers.filter(u => u !== user);
  }

  cancelMemberModal(){
    this.cancelMemberInputModal.emit();
  }
  
  closeMemberModal() {
    this.memberModalClosed.emit();
    // console.log(this.memberModalClosed);
  }

  selectAllUsers(){
    const arrLength = this.storedUsersFromAddChannel.length;
    this.selectedUsersDocId = [];
    for (let i = 0; i < arrLength; i++) {
      this.selectedUsersDocId.push(this.storedUsersFromAddChannel[i].docId || '');
    }
  }

  selectSingleUsers(){
    const arrLength = this.selectedUsers.length;
    this.selectedUsersDocId = [];
    for (let i = 0; i < arrLength; i++) {
      this.selectedUsersDocId.push(this.selectedUsers[i].docId || '');
    }
  }

  submitData() {
    if(this.selectedOption == 1){
      this.selectAllUsers();
      this.usersUpdated.emit(this.selectedUsersDocId);
      this.closeMemberModal();
    }
    if(this.selectedOption == 2){
      this.selectSingleUsers();
      this.usersUpdated.emit(this.selectedUsersDocId);
      this.closeMemberModal();
    }
  }


}
