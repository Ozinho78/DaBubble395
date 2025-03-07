import { Component } from '@angular/core';
import { NewMessagesInputComponent } from "./new-messages-input/new-messages-input.component";

@Component({
  selector: 'app-new-messages',
  imports: [NewMessagesInputComponent],
  templateUrl: './new-messages.component.html',
  styleUrl: './new-messages.component.scss'
})
export class NewMessagesComponent {



}

