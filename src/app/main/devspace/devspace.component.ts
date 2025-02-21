import { Component, inject, Injectable, OnInit } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import { collection, onSnapshot } from 'firebase/firestore';
import { User } from '../../models/user.model';

@Injectable({
  providedIn: 'root',
})
@Component({
  selector: 'app-devspace',
  imports: [],
  templateUrl: './devspace.component.html',
  styleUrl: './devspace.component.scss',
})
export class DevspaceComponent implements OnInit {
  firestore: Firestore = inject(Firestore);

  userDatabase = collection(this.firestore, 'users');
  users: User[] = [];

  testData = [
    {
      password: '6Boh2tS3saxHDWswwuGX',
      avatar: 'avatar1.png',
      name: 'Steffen Hoffmann',
      mail: 'steffen.hoffmann@hotmail.com',
    },
    {
      avatar: 'avatar3.png',
      password: 'Tng55pMIXGbUfhOqkU63',
      mail: 'elise.roth@da-akademie.com',
      name: 'Elise Roth',
    },
    {
      password: '4081752b278a47a544ed7afc0d738b02',
      mail: 'sofia.mueller@offline.gov',
      name: 'Sofia Müller',
      avatar: 'avatar5.png',
    },
    {
      name: 'Noah Braun',
      mail: 'noah.braun@example.com',
      avatar: 'avatar4.png',
      password: '5f4dcc3b5aa765d61d8327deb882cf99',
    },
    {
      name: 'Frederik Beck',
      mail: 'fred.beck@email.com',
      password: 'c581a959b6972b909d6e4cec06670c08',
      avatar: 'avatar6.png',
    },
    {
      mail: 'elias.neumann@gmail.com',
      avatar: 'avatar2.png',
      password: 'zW8U5VZ5wbrb8Ng8RfKE',
      name: 'Elias Neumann',
    },
  ];

  unsubUserNames;

  constructor() {
    let singleUser;
    let str = '';
    this.unsubUserNames = onSnapshot(this.userDatabase, (list) => {
      list.forEach((element) => {
        // this.users[element.id] = element.data();
        singleUser = element.data() as User;
        str = singleUser.avatar;
        singleUser.id = parseInt(str.match(/\d+/)?.[0] || '0', 10);
        singleUser.docId = element.id;
        this.users.push(singleUser);
        // console.log(element.data());
      });
    });
  }

  ngOnInit() {
    // this.sortUsersByAvatar();
    // this.users.sort(
    //   (start: User, end: User) => (end?.id || 0) - (start?.id || 0)
    // );
    
    // this.users.sort((a, b) => a.avatar.localeCompare(b.avatar));

    this.users.sort(
      (start: User, end: User) => (end?.id || 0) - (start?.id || 0)
    );

    console.log(this.users);

  }

  sortUsersByAvatar() {
    this.users.sort((a, b) => {
      const numA = parseInt(a.avatar.match(/\d+/)?.[0] || '0', 10);
      const numB = parseInt(b.avatar.match(/\d+/)?.[0] || '0', 10);
      return numA - numB; // Absteigende Sortierung
    });
  }

  ngOnDestroy(): void {
    //Called once, before the instance is destroyed.
    //Add 'implements OnDestroy' to the class.
    this.unsubUserNames();
  }
}
