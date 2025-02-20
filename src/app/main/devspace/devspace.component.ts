import { Component, inject, Injectable } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import { collection, onSnapshot } from 'firebase/firestore';

@Injectable({
  providedIn: 'root'
})

@Component({
  selector: 'app-devspace',
  imports: [],
  templateUrl: './devspace.component.html',
  styleUrl: './devspace.component.scss'
})
export class DevspaceComponent {
  firestore: Firestore = inject(Firestore);
  
  userDatabase = collection(this.firestore, 'users');
  users: any = [{}];

  unsubUserNames;

  constructor(){
    let i = 0;
    this.unsubUserNames = onSnapshot(this.userDatabase, (list) => {
      list.forEach(element => {
        // this.users[element.id] = element.data();
        this.users.push(element.data());
        // console.log(element.data());
        console.log(element.data());
        
      });
    });
  }


  ngOnDestroy(): void {
    //Called once, before the instance is destroyed.
    //Add 'implements OnDestroy' to the class.
    this.unsubUserNames();
  }


}
