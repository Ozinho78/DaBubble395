import { Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { User } from '../../../../models/user.model';
import { Channel } from '../../../../models/channel.model';
import { Observable, Subscription } from 'rxjs';
import { FirestoreService } from '../../../../services/firestore.service';
import { CommonModule } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { addDoc, collection, doc, Firestore, getDoc } from '@angular/fire/firestore';
import { Thread } from '../../../../models/thread.class';
import { Message } from '../../../../models/message.class';
import { ChatService } from '../../../../services/direct-meassage.service';
import { UserService } from '../../../../services/user.service';
import { MessageInputComponent } from "../../thread/message-input/message-input.component";

@Component({
  selector: 'app-new-messages',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, MessageInputComponent],
  templateUrl: './new-messages.component.html',
  styleUrl: './new-messages.component.scss',
})
export class NewMessagesComponent implements OnInit {
  firestore: Firestore = inject(Firestore);
  userDatabase = collection(this.firestore, 'users');
  channelDatabase = collection(this.firestore, 'channels');
  chatsDatabase = collection(this.firestore, 'chats');
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
  
  enableInputTop: Boolean = true;
  enableInputBottom: Boolean = false;
  inputBottomValue: string = '';
  enteredEmail: string | null = null; // Speichert die erkannte E-Mail
  errorMessage: string | null = null; // Variable für Fehlermeldung

  newThread: Thread | null = null;
  newMessage: Message | null = null;
  invalidInput: Boolean = true;

  sendMessagesArray: string[] = [];
  @ViewChild('inputTopRef') inputTopRef!: ElementRef<HTMLInputElement>;


  private inputSubscription?: Subscription;

  constructor(private dataService: FirestoreService, private chatService: ChatService, private userService: UserService) {
    setTimeout(() => {
      this.userLoggedIn = localStorage.getItem('user-id') || '';
    }, 1000);
  }

  ngAfterViewInit() {
    if (this.enableInputTop && this.inputTopRef) {
      setTimeout(() => {
        this.inputTopRef.nativeElement.focus();
      }, 0);
    }
  }

  ngOnInit() {
    // Streams für die Firestore-Daten
    this.users$ = this.dataService.users$;
    this.channels$ = this.dataService.channels$;

    this.userLoggedIn = localStorage.getItem('user-id') || '';
    this.getAvatarByDocId(this.userLoggedIn).then(avatar => {
      if (avatar) {
        // console.log("Avatar-URL:", avatar);
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
      // console.log('Eingegebener Wert:', value);
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
    // console.log(this.userChannels);
  }

  // Filtert User, wenn "@" erkannt wird
  private filterUsers(value: string) {
    const match = value.match(/(?:^|\s)@(\w*)$/); // `@` muss am Anfang oder nach einem Leerzeichen stehen
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
    this.toggleInputTop();
  }

  // Kanalname einfügen und Liste ausblenden
  insertChannel(channel: Channel) {
    const currentValue = this.inputControl.value || '';
    this.findAndSaveTargetChannel();
    this.inputControl.setValue(
      currentValue.replace(/#\w*$/, `#${channel.name} `)
    );
    this.showChannels = false;
    this.toggleInputTop();
  }

  findAndSaveTargetUser() {
    if (this.inputSubscription) {
      this.inputSubscription.unsubscribe(); // Alte Subscription beenden
    }

    this.inputControl.valueChanges.subscribe((value) => {
      // console.log('Eingegebener Wert:', value);
      this.filterUsers(value || '');

      // Null-Sicherheit hinzufügen (falls value null ist, wird ein leerer String verwendet)
      const trimmedValue = value?.trim() || '';

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

      // console.log('Gefundener User:', this.targetUser);
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
      // console.log('Gefundener Channel:', this.targetChannel);
    });
  }

  toggleInputBottom() {
    this.enableInputBottom = !this.enableInputBottom;
  }

  toggleInputTop() {
    this.enableInputTop = !this.enableInputTop;
  }

  createNewThread() {
    this.newThread = new Thread({
      id: '1',
      channelId: this.targetChannel?.docId || '',
      creationDate: new Date().getTime(),
      reactions: [],
      thread: this.inputBottomValue,
      userId: this.userLoggedIn || '',
    });
    this.saveInputToThreads(this.newThread);
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


  checkEmailAndLockInput() {
    setTimeout(() => {
      // ⛔ Eingabe schon bestätigt? -> Nicht weiter prüfen
      if (this.targetUser || this.targetChannel || this.enteredEmail) {
        return;
      }
  
      const input = this.inputControl.value?.trim();
      this.errorMessage = '';
  
      if (!input) {
        this.errorMessage = 'Bitte etwas eingeben.';
        this.showUsers = false;
        this.showChannels = false;
        this.toggleInputTop();
        return;
      }
  
      if (input.startsWith('@')) {
        const name = input.substring(1);
        const user = this.users.find(u => u.name === name);
  
        if (user) {
          this.targetUser = user;
          this.enableInputTop = false;
          this.inputControl.setValue('');
          return;
        } else {
          this.errorMessage = `Benutzer "@${name}" wurde nicht gefunden.`;
        }
      } else if (input.startsWith('#')) {
        const name = input.substring(1);
        const channel = this.channels.find(c => c.name === name);
  
        if (channel) {
          this.targetChannel = channel;
          this.enableInputTop = false;
          this.inputControl.setValue('');
          return;
        } else {
          this.errorMessage = `Channel "#${name}" wurde nicht gefunden.`;
        }
      } else {
        this.errorMessage = 'Ungültige Eingabe. Bitte @Benutzer oder #Channel verwenden.';
      }
  
      this.showUsers = false;
      this.showChannels = false;
      this.toggleInputTop();
    }, 300); // oder 100, je nach Bedarf
  }
  
  
  

  isValidEmail(email: string): boolean {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailPattern.test(email);
  }


  isValidUserOrChannel(input: string): boolean {
    const userMatch = input.match(/^@\w+$/);
    const channelMatch = input.match(/^#\w+$/);
    return userMatch !== null || channelMatch !== null;
  }

  removeSelection() {
    this.targetUser = null;
    this.targetChannel = null;
    this.enteredEmail = null;
    this.invalidInput = false;
    this.inputControl.enable(); // Eingabe wieder aktivieren
    this.inputControl.setValue(''); // Input-Feld leeren
    this.toggleInputTop();
    this.errorMessage = null; // Fehlermeldung zurücksetzen
  }
}








/*
checkEmailAndLockInput() {
  const input = this.inputControl.value?.trim();
  this.errorMessage = '';
  this.targetUser = null;
  this.targetChannel = null;
  this.enteredEmail = '';

  if (!input) {
    this.errorMessage = 'Bitte etwas eingeben.';
    return;
  }

  if (input.startsWith('@')) {
    const name = input.substring(1);
    const user = this.users.find(u => u.name === name);

    if (user) {
      this.targetUser = user;
      this.enableInputTop = false;
      this.inputControl.setValue('');
      return;
    } else {
      this.errorMessage = `Benutzer "@${name}" wurde nicht gefunden.`;
      console.log(this.errorMessage);
      return;
    }
  }

  if (input.startsWith('#')) {
    const name = input.substring(1);
    const channel = this.channels.find(c => c.name === name);

    if (channel) {
      this.targetChannel = channel;
      this.enableInputTop = false;
      this.inputControl.setValue('');
      return;
    } else {
      this.errorMessage = `Channel "#${name}" wurde nicht gefunden.`;
      console.log(this.errorMessage);
      return;
    }
  }

  // if (this.isValidEmail(input)) {
  //   this.enteredEmail = input;
  //   this.enableInputTop = false;
  //   this.inputControl.setValue('');
  //   return;
  // }

  this.showUsers = false;
  this.showChannels = false;
  this.toggleInputTop(); // das deaktiviert das Input-Feld

  this.errorMessage = 'Ungültige Eingabe. Bitte @Benutzer oder #Channel verwenden.';
  // this.errorMessage = 'Ungültige Eingabe. Bitte @Benutzer, #Channel oder gültige E-Mail verwenden.';
}



*/











    /*
    const inputValue: string = this.inputControl.value?.trim() ?? '';

    this.errorMessage = ''; // 🧽 Erstmal alles löschen

    if (this.isValidEmail(inputValue)) {
      this.enteredEmail = inputValue;  // Speichert die E-Mail
      this.enableInputTop = false;     // Sperrt das Feld
      this.errorMessage = null; // Keine Fehlermeldung
      return;
    }
    
    setTimeout(() => {
      // Falls ein User oder Channel ausgewählt wurde, Input sperren
      if (this.targetUser || this.targetChannel || this.isValidUserOrChannel(inputValue)) {
        this.enableInputTop = false;
        this.errorMessage = null;
        return;
      } else {
        // Falls nichts davon zutrifft -> Fehlermeldung anzeigen
        this.errorMessage = "Bitte eine gültige E-Mail, einen User (@user) oder einen Channel (#channel) eingeben!";
      }
    }, 200);    
    */

/*
  createNewMessage() {
    // userLoggedIn ermitteln
    const senderUser = this.users.find((user) => user.docId);
    this.newMessage = new Message({
      id: '1',
      creationDate: new Date().getTime(),
      reactions: [],
      text: this.inputBottomValue,
      threadId: '',
      userId: this.targetUser?.docId,
      senderName: this.userLoggedIn || '',
      senderAvatar: senderUser?.avatar,
    });
    this.saveInputToMessages(this.newMessage);
  }
*/


/*
  async getUserByIdAsync(userId: string): Promise<User | undefined> {
    const userDocRef = doc(this.firestore, `users/${userId}`);
    const userSnapshot = await getDoc(userDocRef);
    return userSnapshot.exists() ? (userSnapshot.data() as User) : undefined;
  }

  async createNewMessageInChats() {
    const userIdSenderUser = this.userLoggedIn;
    const userIdTargetUser = this.targetUser?.docId;
    const chatId = await this.chatService.getOrCreateChat(userIdSenderUser, userIdTargetUser || '');
    const senderUser = await this.getUserByIdAsync(this.userLoggedIn);
    // console.log("Sender: ", senderUser);
    // console.log("Empfänger: ", this.targetUser);
    this.newMessage = new Message({
      id: '1',
      creationDate: new Date().getTime(),
      reactions: [],
      text: this.inputBottomValue,
      threadId: '',
      userId: userIdSenderUser,
      senderName: senderUser?.name,
      senderAvatar: 'img/avatar/' + senderUser?.avatar,
    });
    await this.chatService.sendMessage(chatId, this.newMessage);
    console.log("ChatId: ", chatId);
    console.log("Message: ", this.newMessage);
    this.inputBottomValue = '';
  }*/


 /*
  addInput() {
    if (this.inputBottomValue.trim() !== '') {
      if (this.targetChannel) {
        this.createNewThread();
      } else if (this.targetUser) {
        this.createNewMessageInChats();
        // this.createNewMessage();
      } else {
        this.errorMessageChannelUser = true;
        setTimeout(() => {this.errorMessageChannelUser = false}, 3000);
      }
      this.sendMessagesArray.push(this.inputBottomValue);
      this.showUsersBottom = false; // Verstecke die Liste nach dem Senden
    } else {
      this.errorMessageEmpty = true;
      setTimeout(() => {this.errorMessageEmpty = false}, 3000);
    }
    this.toggleInputTop();
    this.inputControl.setValue('');  // Für FormControl
    setTimeout(() => {
      this.inputBottomValue = '';
    }, 1000);
  }*/