import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Channel } from '../../../../models/channel.model';
import { AddMemberComponent } from "./add-member/add-member.component";


@Component({
  selector: 'app-add-channel',
  imports: [FormsModule, CommonModule, AddMemberComponent],
  templateUrl: './add-channel.component.html',
  styleUrl: './add-channel.component.scss'
})
export class AddChannelComponent {
  isOpen = false;
  openMemberInput = false;
  nameInput = '';
  descriptionInput = '';
  @Output() memberModalClose = new EventEmitter<void>();

  @Output() onSave = new EventEmitter<Channel>();

  open(){
    this.isOpen = true;
  }

  close(){
    this.isOpen = false;
  }

  resetInputs(){
    this.nameInput = '';
    this.descriptionInput = '';
  }

  createAndEmitNewChannel(){
    let newChannel = new Channel;
    newChannel.name = this.nameInput;
    newChannel.description = this.descriptionInput;
    newChannel.creationDate = new Date();
    // this.onSave.emit(this.nameInput);
    // this.onSave.emit(this.descriptionInput);
    this.openMemberInput = false;
    this.resetInputs();
    // this.close();
  }

  save() {
    if (this.nameInput.trim()) {
      this.close();
      this.openMemberInput = true;
      // this.createAndEmitNewChannel();
    }
  }

  closeMemberInput(){
    this.memberModalClose.emit();
    this.openMemberInput = false;
  }

}
