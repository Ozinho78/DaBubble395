import { inject, Injectable, Injector, runInInjectionContext } from '@angular/core';
import { Firestore, collection, query, where, orderBy, collectionData, doc, docData } from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';
import { Message } from '../models/message.class';
import { Thread } from '../models/thread.class';

@Injectable({
    providedIn: 'root'
})
export class ThreadService {
    private firestore = inject(Firestore);
    private injector = inject(Injector);

    getMessages(threadId: string): Observable<Message[]> {
        const messagesRef = collection(this.firestore, 'messages');
        const q = query(
            messagesRef,
            where('threadId', '==', threadId),
            orderBy('creationDate', 'asc')
        );

        return runInInjectionContext(this.injector, () =>
            collectionData(q, { idField: 'id' }) as Observable<any[]> // Typisierung
        ).pipe(
            map(messages => messages.map(data => new Message(data)))
        );
    }

    getThreadById(threadId: string): Observable<Thread> {
        const threadDocRef = doc(this.firestore, 'threads', threadId);
        return runInInjectionContext(this.injector, () =>
            docData(threadDocRef, { idField: 'id' }) as Observable<Thread> // <== Typisierung
        ).pipe(
            map(data => new Thread(data))
        );
    }
}
