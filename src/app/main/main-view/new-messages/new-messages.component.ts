import { Component, inject, OnInit } from '@angular/core';
import { User } from '../../../../models/user.model';
import { Channel } from '../../../../models/channel.model';
import { Observable } from 'rxjs';
import { FirestoreService } from '../../../../services/firestore.service';
import { CommonModule } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { addDoc, collection, doc, Firestore, getDoc } from '@angular/fire/firestore';
import { Thread } from '../../../../models/thread.class';
import { Message } from '../../../../models/message.class';

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
  userLoggedInAvatar: string = '';

  users$!: Observable<User[]>;
  channels$!: Observable<Channel[]>;

  users: User[] = [];
  channels: Channel[] = [];
  userChannels: Channel[] = [];

  inputControl = new FormControl(''); // Initialisiert mit leerem String!
  inputControlBottom = new FormControl('');
  filteredUsers: User[] = [];
  filteredChannels: Channel[] = [];
  filteredUsersBottom: User[] = [];

  showUsers = false;
  showChannels = false;
  showUsersBottom = false;
  errorMessageChannelUser = false;
  errorMessageEmpty = false;

  targetUser: User | null = null;
  targetChannel: Channel | null = null;

  enableInputBottom: Boolean = false;
  inputBottomValue: string = '';

  newThread: Thread | null = null;
  newMessage: Message | null = null;

  sendMessagesArray: string[] = [];

  constructor(private dataService: FirestoreService) {
    setTimeout(() => {
      this.userLoggedIn = localStorage.getItem('user-id') || '';
    }, 500);
  }

  ngOnInit() {
    // Streams für die Firestore-Daten
    this.users$ = this.dataService.users$;
    this.channels$ = this.dataService.channels$;

    this.userLoggedIn = localStorage.getItem('user-id') || '';
    this.getAvatarByDocId(this.userLoggedIn).then(avatar => {
      if (avatar) {
        console.log("Avatar-URL:", avatar);
        this.userLoggedInAvatar = avatar;
      } else {
        console.log("Kein Avatar gefunden!");
      }
    });    

    // Direkter Zugriff auf die Arrays (sofortige Speicherung)
    // this.users = this.dataService.getUsers();
    // this.channels = this.dataService.getChannels();

    // aktuelle Daten werden geholt und in die lokalen Arrays gespeichert
    this.users$.subscribe((users) => (this.users = users));
    this.channels$.subscribe((channels) => {
      this.channels = channels;
      this.filterUserChannels(); // Filtert die Channels direkt nach dem Laden
    });

    // Filterung bei jeder Eingabe auslösen und an die Filtermethoden übergeben
    this.inputControl.valueChanges.subscribe((value) => {
      console.log('Eingegebener Wert:', value);
      this.filterUsers(value || '');
      this.filterChannels(value || '');
    });
    // this.filterChannelForUserLoggedIn();
  }

  async getAvatarByDocId(docId: string): Promise<string | null> {
    try {
      const userRef = doc(this.userDatabase, docId);
      const userSnap = await getDoc(userRef);
  
      if (userSnap.exists()) {
        const userData = userSnap.data();
        return userData['avatar'] || null; // Avatar zurückgeben, falls vorhanden
      } else {
        console.log("Kein Benutzer gefunden mit dieser DocID!");
        return null;
      }
    } catch (error) {
      console.error("Fehler beim Abrufen des Avatars:", error);
      return null;
    }
  }


  filterUserChannels() {
    if (!this.userLoggedIn) return;
    this.userChannels = this.channels.filter(channel =>
      channel.member.includes(this.userLoggedIn)
    );
    console.log(this.userChannels);
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

    // zeigt nur die Channels des eingeloggten Users an
    this.filteredChannels = this.userChannels.filter((channel) =>
      channel.name.toLowerCase().includes(searchTerm)
    );

    // Zeigt alle Channels an
    // this.filteredChannels = this.channels.filter((channel) =>
    //   channel.name.toLowerCase().includes(searchTerm)
    // );
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
      if (foundUser != null) {
        this.toggleInputBottom();
      }

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
      if (foundChannel != null) {
        this.toggleInputBottom();
      }
      console.log('Gefundener Channel:', this.targetChannel);
    });
  }

  toggleInputBottom() {
    this.enableInputBottom = !this.enableInputBottom;
  }

  createNewThread() {
    const date = new Date();
    this.newThread = new Thread({
      id: '1',
      channelId: this.targetChannel?.docId || '',
      creationDate: date.getTime(),
      reactions: [],
      thread: this.inputBottomValue,
      userId: this.userLoggedIn || '',
    });
    this.saveInputToThreads(this.newThread);
  }
  

  createNewMessage() {
    const date = new Date();
    // userLoggedIn ermitteln
    const senderUser = this.users.find((user) => user.docId);
    // console.log(senderUser);
    this.newMessage = new Message({
      id: '1',
      creationDate: date.getTime(),
      reactions: [],
      text: this.inputBottomValue,
      threadId: '',
      userId: this.targetUser?.docId,
      senderName: this.userLoggedIn || '',
      senderAvatar: senderUser?.avatar,
    });
    this.saveInputToMessages(this.newMessage);
  }

  onInputChange() {
    const atIndex = this.inputBottomValue.lastIndexOf('@');
    if (atIndex !== -1) {
      const searchTermBottom = this.inputBottomValue.substring(atIndex + 1).toLowerCase();
      this.filteredUsersBottom = this.users.filter(user => user.name.toLowerCase().includes(searchTermBottom));
      this.showUsersBottom = this.filteredUsersBottom.length > 0;
    } else {
      this.showUsersBottom = false;
    }
  }

  selectUserBottom(user: User) {
    const atIndex = this.inputBottomValue.lastIndexOf('@');
    if (atIndex !== -1) {
      this.inputBottomValue = this.inputBottomValue.substring(0, atIndex + 1) + user.name + ' ';
    }
    this.showUsersBottom = false;
  }

  addInput() {
    if (this.inputBottomValue.trim() !== '') {
      if (this.targetChannel) {
        this.createNewThread();
      } else if (this.targetUser) {
        this.createNewMessage();
      } else {
        // alert("Ungültiger Channel oder User");
        this.errorMessageChannelUser = true;
        setTimeout(() => {this.errorMessageChannelUser = false}, 3000);
      }
      this.sendMessagesArray.push(this.inputBottomValue);
      this.inputBottomValue = ''; // Eingabe leeren
      this.showUsersBottom = false; // Verstecke die Liste nach dem Senden
    } else {
      // alert("Bitte mal was eingeben, Junge!");
      this.errorMessageEmpty = true;
      setTimeout(() => {this.errorMessageEmpty = false}, 3000);
    }
    this.inputControl.setValue('');  // Für FormControl
    this.inputBottomValue = '';      // Für ngModel
  }

  async saveInputToThreads(thread: Thread) {
    try {
      const threadsCollection = collection(this.firestore, 'threads'); // Sicherstellen, dass du die Collection hast
      await addDoc(threadsCollection, thread.toJSON());
      console.log('Thread saved:', thread);
    } catch (error) {
      console.error('Fehler beim Speichern des Threads:', error);
    }
    this.targetChannel = null;
  }

  async saveInputToMessages(message: Message) {
    try {
      const messageCollection = collection(this.firestore, 'messages'); // Sicherstellen, dass du die Collection hast
      await addDoc(messageCollection, message.toJSON());
      console.log('Message saved:', message);
    } catch (error) {
      console.error('Fehler beim Speichern der Message:', error);
    }
    this.targetUser = null;
  }


}




/* altes Input
addInput() {
  if (this.inputBottomValue.trim() != '') {
    if (this.targetChannel != null) {
      this.createNewThread();
    } else if (this.targetUser != null) {
      this.createNewMessage();
    } else {
        alert("Ungültiger Channel oder User");
      }
  } else {
    alert("Bitte mal was eingeben, Junge!");
  }
  this.sendMessagesArray.push(this.inputBottomValue);
  // console.log(this.sendMessagesArray);
  this.inputBottomValue = ""; // Eingabe leeren
  // this.toggleInputBottom();
}
*/