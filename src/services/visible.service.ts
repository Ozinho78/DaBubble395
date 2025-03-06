import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VisibleService {
  private visibleState = new BehaviorSubject<boolean>(true); // Standardwert ist true
  visibleState$ = this.visibleState.asObservable();
  private visibleComponent = new BehaviorSubject<string>('threads'); // standardmäßig threads-component
  visibleComponent$ = this.visibleComponent.asObservable();


  toggleVisibility() {
    this.visibleState.next(!this.visibleState.value); // Wert umschalten
  }

  setVisibleComponent(component: string) {
    this.visibleComponent.next(component);
  }
}
