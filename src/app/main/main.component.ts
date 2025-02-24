import { Component } from '@angular/core';
import { HeaderComponent } from "./header/header.component";
import { DevspaceComponent } from "./devspace/devspace.component";
import { MainChatComponent } from "./main-chat/main-chat.component";
import { ThreadComponent } from "./thread/thread.component";
import { SidebarComponent } from "./sidebar/sidebar.component";

@Component({
  selector: 'app-main',
  imports: [HeaderComponent, DevspaceComponent, MainChatComponent, ThreadComponent, SidebarComponent],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss'
})
export class MainComponent {
  
}