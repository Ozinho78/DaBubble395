import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from "./header/header.component";
import { DevspaceComponent } from "./devspace/devspace.component";
import { MainViewComponent } from "./main-view/main-view.component";
import { ThreadComponent } from "./thread/thread.component";
import { SidebarComponent } from "./sidebar/sidebar.component";
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-main',
  imports: [CommonModule, HeaderComponent, DevspaceComponent, MainViewComponent, ThreadComponent, SidebarComponent],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss'
})
export class MainComponent implements OnInit {
  channelId: string | null = null;
  threadId: string | null = null;

  constructor(private route: ActivatedRoute, private router: Router) { }

  ngOnInit() {
    this.subscribeRouteParams();
  }

  subscribeRouteParams() {
    this.route.queryParamMap.subscribe(params => {
      this.channelId = params.get('channel');
      this.threadId = params.get('thread');
    });
  }

}