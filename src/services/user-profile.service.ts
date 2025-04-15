import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserProfileService {
  private userProfileSubject = new Subject<any>();

  userProfile$ = this.userProfileSubject.asObservable();

  showUserProfile(user: any) {
    this.userProfileSubject.next(user);
  }
}
