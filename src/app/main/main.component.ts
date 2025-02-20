import { Component } from '@angular/core';
import { HeaderComponent } from "./header/header.component";
import { DevspaceComponent } from "./devspace/devspace.component";
import { MainChatComponent } from "./main-chat/main-chat.component";
import { ThreadsComponent } from "./threads/threads.component";
import { LoginComponent } from './login/login.component';

@Component({
  selector: 'app-main',
  imports: [HeaderComponent, DevspaceComponent, MainChatComponent, ThreadsComponent, LoginComponent],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss'
})
export class MainComponent {

}