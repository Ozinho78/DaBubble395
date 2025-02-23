import { Component } from '@angular/core';
import { HeaderComponent } from "./header/header.component";
import { DevspaceComponent } from "./devspace/devspace.component";
import { MainChatComponent } from "./main-chat/main-chat.component";
import { ThreadsComponent } from "./threads/threads.component";
import { SidebarComponent } from "./sidebar/sidebar.component";

@Component({
  selector: 'app-main',
  imports: [HeaderComponent, DevspaceComponent, MainChatComponent, ThreadsComponent, SidebarComponent],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss'
})
export class MainComponent {
  
}