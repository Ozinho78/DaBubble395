import { Component, inject, OnInit } from '@angular/core';
import { User } from '../../../../models/user.model';
import { Channel } from '../../../../models/channel.model';
import { Observable } from 'rxjs';
import { FirestoreService } from '../../../../services/firestore.service';
import { CommonModule } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { addDoc, collection, Firestore } from '@angular/fire/firestore';
import { Thread } from '../../../../models/thread.class';

@Component({
  selector: 'app-new-messages',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './new-messages.component.html',
  styleUrl: './new-messages.component.scss',
})
export class NewMessagesComponent implements OnInit {
  firestore: Firestore = inject(Firestore);
  userDatabase = collection(this.firestore, 'users');
  channelDatabase = collection(this.firestore, 'channels');
  threadsDatabase = collection(this.firestore, 'threads');
  userLoggedIn: string = '';

  users$!: Observable<User[]>;
  channels$!: Observable<Channel[]>;

  users: User[] = [];
  channels: Channel[] = [];

  inputControl = new FormControl(''); // Initialisiert mit leerem String!
  inputControlBottom = new FormControl('');
  filteredUsers: User[] = [];
  filteredChannels: Channel[] = [];

  showUsers = false;
  showChannels = false;

  targetUser: User | null = null;
  targetChannel: Channel | null = null;

  enableInputBottom: Boolean = false;
  inputBottomValue: string = '';

  newThread: Thread | null = null;
  // newThread = new Thread({});
  // newThread!: Thread;
  // newThread: Thread = {
  //   id: '',
  //   channelId: '',
  //   creationDate: null,
  //   reactions: [],
  //   thread: '',
  //   userId: '',
  //   toJSON: function (): { channelId: string; creationDate: number | null; reactions: string[]; thread: string; userId: string; } {
  //     throw new Error('Function not implemented.');
  //   }
  // };


  constructor(private dataService: FirestoreService) {
    setTimeout(() => {
      this.userLoggedIn = localStorage.getItem('user-id') || '';
    }, 500);
  }

  ngOnInit() {
    // Streams für die Firestore-Daten
    this.users$ = this.dataService.users$;
    this.channels$ = this.dataService.channels$;

    // Direkter Zugriff auf die Arrays (sofortige Speicherung)
    // this.users = this.dataService.getUsers();
    // this.channels = this.dataService.getChannels();

    // aktuelle Daten werden geholt und in die lokalen Arrays gespeichert
    this.users$.subscribe((users) => (this.users = users));
    this.channels$.subscribe((channels) => (this.channels = channels));

    // Filterung bei jeder Eingabe auslösen und an die Filtermethoden übergeben
    this.inputControl.valueChanges.subscribe((value) => {
      console.log('Eingegebener Wert:', value);
      this.filterUsers(value || '');
      this.filterChannels(value || '');
    });
  }

  // Filtert User, wenn "@" erkannt wird
  private filterUsers(value: string) {
    const match = value.match(/@(\w*)$/); // sucht nach @ am Ende der Eingabe
    this.showUsers = !!match; // Zeige User-Liste nur, wenn "@" eingegeben wurde
    if (!match) {
      // Kein "@" eingegeben
      this.filteredUsers = []; // Array bleibt leer
      return; // Methode beenden
    }
    const searchTerm = match[1].toLowerCase();
    this.filteredUsers = this.users.filter((user) =>
      user.name.toLowerCase().includes(searchTerm)
    ); // Benutzer werden nach dem Suchbegriff gefiltert
  }

  // Filtert Channels, wenn "#" erkannt wird
  private filterChannels(value: string) {
    const match = value.match(/#(\w*)$/);
    this.showChannels = !!match; // Zeige Channel-Liste nur, wenn "#" eingegeben wurde
    if (!match) {
      this.filteredChannels = [];
      return;
    }
    const searchTerm = match[1].toLowerCase();
    this.filteredChannels = this.channels.filter((channel) =>
      channel.name.toLowerCase().includes(searchTerm)
    );
  }

  // Benutzername einfügen und Liste ausblenden
  insertUser(user: User) {
    const currentValue = this.inputControl.value || '';
    this.findAndSaveTargetUser();
    this.inputControl.setValue(currentValue.replace(/@\w*$/, `@${user.name} `)); // @ wird ersetzt durch Namen des Benutzer (aber mit @ davor)
    this.showUsers = false; // Liste danach wieder ausblenden
  }

  // Kanalname einfügen und Liste ausblenden
  insertChannel(channel: Channel) {
    const currentValue = this.inputControl.value || '';
    this.findAndSaveTargetChannel();
    this.inputControl.setValue(
      currentValue.replace(/#\w*$/, `#${channel.name} `)
    );
    this.showChannels = false;
  }

  findAndSaveTargetUser() {
    this.inputControl.valueChanges.subscribe((value) => {
      console.log('Eingegebener Wert:', value);
      this.filterUsers(value || '');

      // Null-Sicherheit hinzufügen (falls value null ist, wird ein leerer String verwendet)
      const trimmedValue = value?.trim() || '';
      // const trimmedValue = this.inputControl.value?.trim() || '';

      // Falls ein User mit genau diesem Namen existiert, speichern
      const foundUser = this.users.find(
        (user) => `@${user.name}` === trimmedValue
      );
      this.targetUser = foundUser || null;
      if(foundUser != null){this.toggleInputBottom();}

      // für Teilmatches
      // const foundUser = this.users.find(user => user.name.toLowerCase().includes (value.replace('@', '').toLowerCase()));

      console.log('Gefundener User:', this.targetUser);
    });
  }

  findAndSaveTargetChannel() {
    this.inputControl.valueChanges.subscribe((value) => {
      // console.log('Eingegebener Wert:', value);
      this.filterChannels(value || '');
      const trimmedValue = value?.trim() || '';

      // Falls ein Channel mit genau diesem Namen existiert, speichern
      const foundChannel = this.channels.find(
        (channel) => `#${channel.name}` === trimmedValue
      );
      this.targetChannel = foundChannel || null;
      if(foundChannel != null){this.toggleInputBottom();}
      console.log('Gefundener Channel:', this.targetChannel);
    });
  }

  toggleInputBottom(){
    this.enableInputBottom = !this.enableInputBottom;
  }

  addInput(){
    if(this.inputBottomValue.trim() != ''){
      const date = new Date();
      this.newThread = new Thread({
        id: '1',
        channelId: this.targetChannel?.docId || '',
        creationDate: date.getTime(),
        reactions: [],
        thread: this.inputBottomValue,
        userId: this.userLoggedIn || ''
      });
      this.saveInputToThreads(this.newThread);
    }
    // this.toggleInputBottom();
  }

  async saveInputToThreads(thread: Thread) {
    try {
      const threadsCollection = collection(this.firestore, 'threads'); // Sicherstellen, dass du die Collection hast
      await addDoc(threadsCollection, thread.toJSON());
      console.log('Thread saved:', thread);
    } catch (error) {
      console.error('Fehler beim Speichern des Threads:', error);
    }
  }

  // async saveInputToThreads(thread: Thread) {
  //   await addDoc(this.threadsDatabase, thread.toJSON());
  //   console.log('Thread saved:', thread);
  // }
}
