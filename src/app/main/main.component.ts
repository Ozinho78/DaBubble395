import { Component } from '@angular/core';
import { HeaderComponent } from "./header/header.component";
import { DevspaceComponent } from "./devspace/devspace.component";
import { MainViewComponent } from "./main-view/main-view.component";
import { ThreadComponent } from "./thread/thread.component";
import { SidebarComponent } from "./sidebar/sidebar.component";

@Component({
  selector: 'app-main',
  imports: [HeaderComponent, DevspaceComponent, MainViewComponent, ThreadComponent, SidebarComponent],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss'
})
export class MainComponent {
  
}