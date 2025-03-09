import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ThreadsComponent } from "./threads/threads.component";
import { DirectMessagesComponent } from "./direct-messages/direct-messages.component";
import { NewMessagesComponent } from "./new-messages/new-messages.component";

import { VisibleService } from '../../../services/visible.service';

@Component({
    selector: 'app-main-view',
    imports: [ThreadsComponent, DirectMessagesComponent, NewMessagesComponent, CommonModule],
    templateUrl: './main-view.component.html',
    styleUrl: './main-view.component.scss'
})
export class MainViewComponent implements OnInit {
    visibleComponent: string = '';
    channelId: string = '';

    constructor(
        private visibilityService: VisibleService
    ) { }

    ngOnInit() {
        //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
        //Add 'implements OnInit' to the class.
        this.visibilityService.visibleComponent$.subscribe(component => {
            this.visibleComponent = component;
        });
    }

    setVisibleComponent(component: string) {
        this.visibilityService.setVisibleComponent(component);
    }

}
