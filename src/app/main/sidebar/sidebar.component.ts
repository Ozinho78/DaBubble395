import { Component } from '@angular/core';
import { VisibleService } from '../../../services/visible.service';

@Component({
  selector: 'app-sidebar',
  imports: [],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  devSpaceHidden = false;
  constructor(private visibleService: VisibleService) {}

  toggleDevspace() {
    this.visibleService.toggleVisibility();
    this.devSpaceHidden = !this.devSpaceHidden;
  }
}
