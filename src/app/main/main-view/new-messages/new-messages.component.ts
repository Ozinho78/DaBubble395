import { Component, inject, OnInit } from '@angular/core';
import { User } from '../../../../models/user.model';
import { Channel } from '../../../../models/channel.model';
import { map, Observable, startWith } from 'rxjs';
import { FirestoreService } from '../../../../services/firestore.service';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { addDoc, collection, Firestore } from '@angular/fire/firestore';

@Component({
  selector: 'app-new-messages',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './new-messages.component.html',
  styleUrl: './new-messages.component.scss',
})
export class NewMessagesComponent implements OnInit {
  firestore: Firestore = inject(Firestore);
  userDatabase = collection(this.firestore, 'users');
  channelDatabase = collection(this.firestore, 'channels');

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

  constructor(private dataService: FirestoreService) {}

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
    this.inputControl.setValue(
      currentValue.replace(/#\w*$/, `#${channel.name} `)
    );
    this.showChannels = false;
  }

  findAndSaveTargetUser() {
    this.inputControl.valueChanges.subscribe((value) => {
      console.log('Eingegebener Wert:', value); // Debugging

      this.filterUsers(value || '');
      this.filterChannels(value || '');

      // Null-Sicherheit hinzufügen (falls value null ist, wird ein leerer String verwendet)
      const trimmedValue = value?.trim() || '';

      // Falls ein User mit genau diesem Namen existiert, speichern
      const foundUser = this.users.find(
        (user) => `@${user.name}` === trimmedValue
      );
      this.targetUser = foundUser || null;

      // für Teilmatches
      // const foundUser = this.users.find(user => user.name.toLowerCase().includes (value.replace('@', '').toLowerCase()));

      console.log('Gefundener User:', this.targetUser);
    });
  }

  async saveChannelToFirestore(channel: Channel) {
    await addDoc(this.channelDatabase, channel.toJson());
    // console.log('Channel saved:', channelName);
  }





}
