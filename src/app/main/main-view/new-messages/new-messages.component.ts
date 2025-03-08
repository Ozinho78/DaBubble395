import { Component, OnInit } from '@angular/core';
import { User } from '../../../../models/user.model';
import { Channel } from '../../../../models/channel.model';
import { map, Observable, startWith } from 'rxjs';
import { FirestoreService } from '../../../../services/firestore.service';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-new-messages',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './new-messages.component.html',
  styleUrl: './new-messages.component.scss',
})
export class NewMessagesComponent implements OnInit {
  users$!: Observable<User[]>;
  channels$!: Observable<Channel[]>;

  users: User[] = [];
  channels: Channel[] = [];

  inputControl = new FormControl(''); // Initialisiert mit leerem String!
  filteredUsers: User[] = [];
  filteredChannels: Channel[] = [];

  showUsers = false;
  showChannels = false;

  constructor(private dataService: FirestoreService) {}

  ngOnInit() {
    // Streams für die Firestore-Daten
    this.users$ = this.dataService.users$;
    this.channels$ = this.dataService.channels$;

    // Direkter Zugriff auf die Arrays (sofortige Speicherung)
    // this.users = this.dataService.getUsers();
    // this.channels = this.dataService.getChannels();

    // In lokale Arrays speichern
    this.users$.subscribe(users => (this.users = users));
    this.channels$.subscribe(channels => (this.channels = channels));

    // Filterung bei jeder Eingabe auslösen
    this.inputControl.valueChanges.subscribe(value => {
      console.log('Eingegebener Wert:', value); // Debugging
      this.filterUsers(value || '');
      this.filterChannels(value || '');
    });
  }

  // Filtert User, wenn "@" erkannt wird
  private filterUsers(value: string) {
    const match = value.match(/@(\w*)$/);
    this.showUsers = !!match; // Zeige User-Liste nur, wenn "@" eingegeben wurde
    if (!match) {
      this.filteredUsers = [];
      return;
    }
    const searchTerm = match[1].toLowerCase();
    this.filteredUsers = this.users.filter(user => user.name.toLowerCase().includes(searchTerm));
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
    this.filteredChannels = this.channels.filter(channel => channel.name.toLowerCase().includes(searchTerm));
  }

  // Benutzername einfügen und Liste ausblenden
  insertUser(user: User) {
    const currentValue = this.inputControl.value || '';
    this.inputControl.setValue(currentValue.replace(/@\w*$/, `@${user.name} `));
    this.showUsers = false; // Liste ausblenden
  }

  // Kanalname einfügen und Liste ausblenden
  insertChannel(channel: Channel) {
    const currentValue = this.inputControl.value || '';
    this.inputControl.setValue(currentValue.replace(/#\w*$/, `#${channel.name} `));
    this.showChannels = false; // Liste ausblenden
  }
}
