import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';


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

  @Output() onSave = new EventEmitter<string>();

  open(){
    this.isOpen = true;
  }

  close(){
    this.isOpen = false;
  }

  save() {
    if (this.nameInput.trim()) {
      this.onSave.emit(this.nameInput);
      this.onSave.emit(this.descriptionInput);
      this.close();
    }
  }

}
