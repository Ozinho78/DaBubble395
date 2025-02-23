import { inject, Injectable } from '@angular/core';
import { Firestore, collection, query, where, orderBy, collectionData, doc, docData } from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';
import { Message } from '../models/message.class';
import { Thread } from '../models/thread.class';

@Injectable({
    providedIn: 'root'
})
export class ThreadService {
    private firestore = inject(Firestore);

    getMessages(threadId: string): Observable<Message[]> {
        const messagesRef = collection(this.firestore, 'messages');
        const q = query(
            messagesRef,
            where('threadId', '==', threadId),
            orderBy('creationDate', 'asc')
        );

        return collectionData(q, { idField: 'id' }).pipe(
            map(messages => messages.map(data => new Message(data)))
        );
    }

    getThreadById(threadId: string): Observable<Thread> {
        const threadDocRef = doc(this.firestore, 'threads', threadId);
        return docData(threadDocRef, { idField: 'id' }).pipe(
            map(data => new Thread(data))
        );
    }
}
