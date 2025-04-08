import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from "./header/header.component";
import { DevspaceComponent } from "./devspace/devspace.component";
import { MainViewComponent } from "./main-view/main-view.component";
import { ThreadComponent } from "./thread/thread.component";
import { SidebarComponent } from "./sidebar/sidebar.component";
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-main',
    imports: [CommonModule, HeaderComponent, DevspaceComponent, MainViewComponent, ThreadComponent, SidebarComponent],
    templateUrl: './main.component.html',
    styleUrl: './main.component.scss'
})
export class MainComponent implements OnInit {
    channelId: string | null = null;
    threadId: string | null = null;
    chatId: string | null = null;
    newMessage: string | null = null;

    isMedium = false;
    isSmall = false;

    activeView: 'devspace' | 'main' | 'thread' = 'main';

    constructor(private route: ActivatedRoute) { }

    ngOnInit() {
        this.checkScreenSize();
        window.addEventListener('resize', () => this.checkScreenSize());
        this.subscribeRouteParams();
    }

    subscribeRouteParams() {
        this.route.queryParamMap.subscribe(params => {
            this.channelId = params.get('channel');
            this.threadId = params.get('thread');
            this.chatId = params.get('chat');
            this.newMessage = params.get('newmessage');
    
            this.checkScreenSize();
        });
    }

    checkScreenSize() {
        const width = window.innerWidth;
        this.isMedium = width <= 1400;
        this.isSmall = width <= 992;

        if (this.isSmall) {
            if (this.threadId) {
                this.activeView = 'thread';
            } else if (this.channelId || this.chatId || this.newMessage) {
                this.activeView = 'main';
            } else {
                this.activeView = 'devspace';
            }
        }
    }

    showDevspace(): boolean {
        return !this.isSmall || this.activeView === 'devspace';
    }

    showMainView(): boolean {
        if (this.isSmall) return this.activeView === 'main';
        if (this.isMedium && this.threadId) return false;
        return true;
    }

    showThread(): boolean {
        if (!this.threadId) return false;
        if (this.isSmall) return this.activeView === 'thread';
        if (this.isMedium) return true;
        return true;
    }
}