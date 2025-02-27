import { Component } from '@angular/core';
import { ThreadsComponent } from "./threads/threads.component";

@Component({
  selector: 'app-main-view',
  imports: [ThreadsComponent],
  templateUrl: './main-view.component.html',
  styleUrl: './main-view.component.scss'
})
export class MainViewComponent {

}
