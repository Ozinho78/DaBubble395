import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { arrayUnion, collection, doc, Firestore, getDoc, getDocs, updateDoc } from '@angular/fire/firestore';
import { User } from '../../../../../models/user.model';
import { Channel } from '../../../../../models/channel.model';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-add-user',
  imports: [CommonModule, FormsModule],
  templateUrl: './add-user.component.html',
  styleUrl: './add-user.component.scss'
})
export class AddUserComponent {
  isOpen = false; // Steuert, ob das Modal sichtbar ist

  @Input() channelIdInput!: string;
  @Output() closeModal = new EventEmitter<void>();

  channelToChange!: Channel | null;
  searchQuery: string = '';
  users: User[] = []; // Alle Benutzer aus der Datenbank
  filteredUsers: User[] = []; // Gefilterte Benutzerliste
  selectedUser: User | null = null;

  constructor(private firestore: Firestore){}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['channelIdInput'] && this.channelIdInput) {
      this.loadChannel(this.channelIdInput);
      this.loadUsers(); // Alle Benutzer aus Firestore laden
    }
  }

  async loadChannel(docId: string) {
    const docRef = doc(this.firestore, 'channels', docId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      this.channelToChange = new Channel();
      this.channelToChange.docId = docSnap.id;
      this.channelToChange.creationDate = data['creationDate'];
      this.channelToChange.name = data['name'];
      this.channelToChange.description = data['description'];
      this.channelToChange.member = data['member'] || [];
      this.channelToChange.userId = data['userId'];
    }
  }

  async loadUsers() {
    const usersCollection = collection(this.firestore, 'users');
    const usersSnapshot = await getDocs(usersCollection);
    this.users = usersSnapshot.docs.map(doc => {
      const data = doc.data();
      return { docId: doc.id, ...data } as User;
    });
  }

  searchUsers() {
    this.filteredUsers = this.users
      .filter(user => user.name.toLowerCase().includes(this.searchQuery.toLowerCase()))
      .filter(user => user.docId && !this.channelToChange?.member.includes(user.docId)); // Nur Nicht-Mitglieder anzeigen
  }

  selectUser(user: User) {
    this.selectedUser = user;
  }

  async addUser() {
    if (!this.selectedUser || !this.channelToChange?.docId) {
      console.error("Kein Benutzer ausgewählt oder Channel nicht gefunden.");
      return;
    }
  
    try {
      const channelRef = doc(this.firestore, `channels/${this.channelToChange.docId}`);
      await updateDoc(channelRef, {
        member: arrayUnion(this.selectedUser.docId)
      });
  
      if (this.selectedUser.docId) {
        this.channelToChange.member.push(this.selectedUser.docId);
      } else {
        console.error("Fehler: Der Benutzer hat keine docId.");
      }
      this.selectedUser = null;
      this.searchQuery = '';
      this.filteredUsers = [];
      alert('Benutzer wurde hinzugefügt!');
    } catch (error) {
      console.error("Fehler beim Hinzufügen des Benutzers:", error);
    }
  }

  
  openModal() {
    this.isOpen = true;
  }

  close() {
    this.isOpen = false;
    this.closeModal.emit(); // Sendet Event an Parent
  }
}
  
  
  // userId Michael Fiebelkorn ktUA231gfQVPbWIyhBU8
