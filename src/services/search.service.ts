import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  query,
  where,
  getDocs,
  collectionData,
  getDoc,
  doc
} from '@angular/fire/firestore';
import { firstValueFrom, Observable } from 'rxjs';
import { SearchResult } from '../models/search-result.model';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private firestore = inject(Firestore);

  // 1. Hole Channels, in denen der User Mitglied ist
  getUserChannels(userId: string): Observable<any[]> {
    const channelsRef = collection(this.firestore, 'channels');
    const q = query(channelsRef, where('member', 'array-contains', userId));
    return collectionData(q, { idField: 'docId' }) as Observable<any[]>;
  }

  // 2. Suche in Threads dieser Channels
  async searchUserThreads(userId: string, searchTerm: string): Promise<any[]> {
    const userChannels = await firstValueFrom(this.getUserChannels(userId));
    const allowedChannelMap = new Map<string, string>(); // <channelId, channelName>
  
    for (const channel of userChannels) {
      allowedChannelMap.set(channel.docId, channel.name);
    }
  
    const threadsRef = collection(this.firestore, 'threads');
    const allThreadsSnap = await getDocs(threadsRef);
  
    const results: any[] = [];
  
    for (const threadSnap of allThreadsSnap.docs) {
      const threadData = threadSnap.data();
      const threadId = threadSnap.id;
      const channelId = threadData['channelId'];
  
      if (!allowedChannelMap.has(channelId)) continue;
  
      const threadText = (threadData['thread'] ?? '').toLowerCase();
      if (threadText.includes(searchTerm.toLowerCase())) {
        results.push({
          title: threadData['thread'],
          threadId: threadId,
          channelId: channelId,
          channelName: allowedChannelMap.get(channelId) || 'Unbekannter Channel'
        });
      }
    }
  
    return results;
  }



  async searchUserMessages(userId: string, searchTerm: string): Promise<any[]> {
    const userChannels = await firstValueFrom(this.getUserChannels(userId));
    const channelMap = new Map<string, string>(); // channelId → channelName
  
    for (const channel of userChannels) {
      channelMap.set(channel.docId, channel.name);
    }
  
    // Alle Threads holen
    const threadsRef = collection(this.firestore, 'threads');
    const threadsSnap = await getDocs(threadsRef);
  
    const allowedThreads = threadsSnap.docs
  .filter(doc => channelMap.has(doc.data()['channelId']))
  .map(doc => {
    const data = doc.data() as { channelId: string }; // 👈 Typ angeben
    return { ...data, docId: doc.id };
  });
  
    const threadIdMap = new Map<string, { channelId: string, channelName: string }>();
    for (const thread of allowedThreads) {
      threadIdMap.set(thread.docId, {
        channelId: thread.channelId,
        channelName: channelMap.get(thread.channelId) || 'Unbekannt'
      });
    }
  
    // Jetzt alle messages holen
    const messagesRef = collection(this.firestore, 'messages');
    const messagesSnap = await getDocs(messagesRef);
  
    const resultMessages = [];
  
    for (const msg of messagesSnap.docs) {
      const data = msg.data();
      const threadId = data['threadId'];
      const text = (data['text'] ?? '').toLowerCase();
  
      if (text.includes(searchTerm.toLowerCase()) && threadIdMap.has(threadId)) {
        const { channelId, channelName } = threadIdMap.get(threadId)!;
  
        resultMessages.push({
          text: data['text'],
          threadId: threadId,
          channelId,
          channelName,
          userId: data['userId'],
          creationDate: data['creationDate']
        });
      }
    }
  
    return resultMessages;
  }


  async searchEverything(userId: string, searchTerm: string): Promise<SearchResult[]> {
    const userChannels = await firstValueFrom(this.getUserChannels(userId));
    const channelMap = new Map<string, string>(); // channelId → channelName
  
    for (const channel of userChannels) {
      channelMap.set(channel.docId, channel.name);
    }
  
    // THREADS
    const threadsRef = collection(this.firestore, 'threads');
    const threadsSnap = await getDocs(threadsRef);
  
    const threadResults: any[] = [];
  
    const allowedThreads = threadsSnap.docs
      .filter(doc => channelMap.has(doc.data()['channelId']))
      .map(doc => {
        const data = doc.data() as { channelId: string; thread: string };
        return { ...data, docId: doc.id };
      });
  
    for (const thread of allowedThreads) {
      if ((thread.thread ?? '').toLowerCase().includes(searchTerm.toLowerCase())) {
        threadResults.push({
          type: 'thread',
          title: thread.thread,
          threadId: thread.docId,
          channelId: thread.channelId,
          channelName: channelMap.get(thread.channelId) || 'Unbekannt'
        });
      }
    }
  
    // MESSAGES
    const messagesRef = collection(this.firestore, 'messages');
    const messagesSnap = await getDocs(messagesRef);
  
    const messageResults: any[] = [];
  
    for (const msg of messagesSnap.docs) {
      const data = msg.data();
      const text = (data['text'] ?? '').toLowerCase();
      const threadId = data['threadId'];
  
      if (!text.includes(searchTerm.toLowerCase())) continue;
  
      const matchingThread = allowedThreads.find(t => t.docId === threadId);
      if (!matchingThread) continue;
  
      messageResults.push({
        type: 'message',
        text: data['text'],
        threadId: threadId,
        channelId: matchingThread.channelId,
        channelName: channelMap.get(matchingThread.channelId) || 'Unbekannt',
        userId: data['userId'],
        creationDate: data['creationDate']
      });
    }

    const directMessages = await this.searchDirectMessages(userId, searchTerm);
    return [...threadResults, ...messageResults, ...directMessages];
  }


  async searchDirectMessages(userId: string, searchTerm: string): Promise<any[]> {
    const chatsRef = collection(this.firestore, 'chats');
    const q = query(chatsRef, where('participants', 'array-contains', userId));
    const chatsSnap = await getDocs(q);
  
    const results: any[] = [];
  
    for (const chatDoc of chatsSnap.docs) {
      const chatId = chatDoc.id;
      const chatData = chatDoc.data();
      const otherUserId = (chatData['participants'] as string[]).find(id => id !== userId);
      // 🛑 Sicherheits-Check:
      if (!otherUserId || otherUserId.trim() === '') {
        console.warn(`❌ Kein otherUserId gefunden in chat "${chatId}" mit participants:`, chatData['participants']);
        continue;
      }

      const userRef = doc(this.firestore, 'users', otherUserId!);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.exists() ? userSnap.data() : null;
  
      const messagesRef = collection(this.firestore, `chats/${chatId}/messages`);
      const messagesSnap = await getDocs(messagesRef);
  
      for (const msgDoc of messagesSnap.docs) {
        const data = msgDoc.data();
        const text = (data['text'] ?? '').toLowerCase();
  
        if (text.includes(searchTerm.toLowerCase())) {
          results.push({
            type: 'direct',
            text: data['text'],
            chatId,
            otherUserName: userData?.['name'] || 'Unbekannt',
            otherUserAvatar: userData?.['avatar'] || 'default.png',
            userId: data['userId'], // wer hat's geschickt?
            creationDate: data['creationDate']
          });
        }
      }
    }
  
    return results;
  }


}






/*
// alte Suche nur für Threads von einem selbst erstellt
async performSearch(term: string): Promise<void> {
  const threadsRef = collection(this.firestore, 'threads');
  const q = query(threadsRef, where('userId', '==', this.currentUser.docId));
  const threadSnaps = await getDocs(q);
  const results: any[] = [];
  for (const threadSnap of threadSnaps.docs) {
    const threadData = threadSnap.data();
    const threadId = threadSnap.id;
    const threadText = (threadData['thread'] ?? '').toLowerCase();
    if (threadText.includes(term.toLowerCase())) {
      results.push({
        title: threadData['thread'],
        userId: { ...threadData, docId: threadId }
      });
    }
  }
this.searchResults = results;
console.log('✅ Gefundene Threads:', results.length);
}
*/