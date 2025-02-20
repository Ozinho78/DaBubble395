import { inject, Injectable } from '@angular/core';
import { Firestore, collection, query, where, orderBy, collectionData } from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';
import { Message } from '../models/message.class';

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
}
