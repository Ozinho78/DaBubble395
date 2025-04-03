import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
} from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class SearchModalService {
  private firestore = inject(Firestore);

  async loadMessagesForThread(threadId: string): Promise<any[]> {
    const messagesRef = collection(this.firestore, 'messages');
    const q = query(messagesRef, where('threadId', '==', threadId));
    const snaps = await getDocs(q);

    return await this.addUserDataToMessages(snaps.docs.map((d) => d.data()));
  }

  async loadMessagesForChat(chatId: string): Promise<any[]> {
    const messagesRef = collection(this.firestore, `chats/${chatId}/messages`);
    const snaps = await getDocs(messagesRef);

    return await this.addUserDataToMessages(snaps.docs.map((d) => d.data()));
  }

  private async addUserDataToMessages(messages: any[]): Promise<any[]> {
    return await Promise.all(
      messages.map(async (msg) => {
        const userRef = doc(this.firestore, 'users', msg.userId);
        try {
          const userSnap = await getDoc(userRef);
          const userData = userSnap.exists() ? userSnap.data() : null;

          return {
            ...msg,
            senderName: userData?.['name'] || 'Unbekannt',
            senderAvatar: userData?.['avatar'] || 'default.png',
          };
        } catch {
          return {
            ...msg,
            senderName: 'Unbekannt',
            senderAvatar: 'default.png',
          };
        }
      })
    );
  }
}

/*
// alte Version mit alles in einem aus header.ts
async openThreadModal(result: any): Promise<void> {
    this.selectedThreadMessages = [];
  
    if (result.type === 'thread' || result.type === 'message') {
      const messagesRef = collection(this.firestore, 'messages');
      const q = query(messagesRef, where('threadId', '==', result.threadId));
      const messageSnaps = await getDocs(q);
  
      const messagesWithUserData = await Promise.all(
        messageSnaps.docs.map(async docSnap => {
          const msgData = docSnap.data();
          const userRef = doc(this.firestore, 'users', msgData['userId']);
  
          try {
            const userSnap = await getDoc(userRef);
            const userData = userSnap.exists() ? userSnap.data() : null;
  
            return {
              ...msgData,
              senderName: userData?.['name'] || 'Unbekannt',
              senderAvatar: userData?.['avatar'] || 'default.png'
            };
          } catch {
            return {
              ...msgData,
              senderName: 'Unbekannt',
              senderAvatar: 'default.png'
            };
          }
        })
      );
  
      this.selectedThreadTitle = result.title;
      this.selectedThreadMessages = messagesWithUserData;
      this.modalOpen = true;
    }
  
    else if (result.type === 'direct') {
      const messagesRef = collection(this.firestore, `chats/${result.chatId}/messages`);
      const messageSnaps = await getDocs(messagesRef);
  
      const messagesWithUserData = await Promise.all(
        messageSnaps.docs.map(async docSnap => {
          const msgData = docSnap.data();
          const userRef = doc(this.firestore, 'users', msgData['userId']);
  
          try {
            const userSnap = await getDoc(userRef);
            const userData = userSnap.exists() ? userSnap.data() : null;
  
            return {
              ...msgData,
              senderName: userData?.['name'] || 'Unbekannt',
              senderAvatar: userData?.['avatar'] || 'default.png'
            };
          } catch {
            return {
              ...msgData,
              senderName: 'Unbekannt',
              senderAvatar: 'default.png'
            };
          }
        }
      )
      );
  
      this.selectedThreadTitle = `Direktnachricht mit ${result.otherUserName}`;
      this.selectedThreadMessages = messagesWithUserData;
      this.modalOpen = true;
    }
    else if (result.type === 'user') {
      this.selectedThreadTitle = result.name;
      this.selectedThreadMessages = [
        {
          text: result.email,
          senderName: result.name,
          senderAvatar: result.avatar
        }
      ];
      this.modalOpen = true;
    }
  }

*/
