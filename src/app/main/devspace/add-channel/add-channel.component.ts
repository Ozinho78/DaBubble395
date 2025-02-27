import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Channel } from '../../../../models/channel.model';


@Component({
  selector: 'app-add-channel',
  imports: [FormsModule, CommonModule],
  templateUrl: './add-channel.component.html',
  styleUrl: './add-channel.component.scss'
})
export class AddChannelComponent {
  isOpen = false;
  nameInput = '';
  descriptionInput = '';

  @Output() onSave = new EventEmitter<Channel>();

  open(){
    this.isOpen = true;
  }

  close(){
    this.isOpen = false;
  }

  save() {
    if (this.nameInput.trim()) {
      let newChannel = new Channel;
      newChannel.name = this.nameInput;
      newChannel.description = this.descriptionInput;
      newChannel.creationDate = new Date();
      // this.onSave.emit(this.nameInput);
      // this.onSave.emit(this.descriptionInput);
      this.onSave.emit(newChannel);
      this.close();
    }
  }

}
