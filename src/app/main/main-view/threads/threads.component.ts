import { Component } from '@angular/core';
import { MessageInputComponent } from "../../thread/message-input/message-input.component";

@Component({
  selector: 'app-threads',
  imports: [MessageInputComponent],
  templateUrl: './threads.component.html',
  styleUrl: './threads.component.scss'
})
export class ThreadsComponent {

}
