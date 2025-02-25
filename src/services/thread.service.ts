import { inject, Injectable, Injector, runInInjectionContext } from '@angular/core';
import { Firestore, collection, query, where, orderBy, collectionData, doc, docData, getDoc } from '@angular/fire/firestore';
import { Observable, from, map, switchMap } from 'rxjs';
import { Message } from '../models/message.class';
import { Thread } from '../models/thread.class';

@Injectable({
    providedIn: 'root'
})
export class ThreadService {
    private firestore = inject(Firestore);
    private injector = inject(Injector);

    getThreadById(threadId: string): Observable<Thread> {
        const threadDocRef = doc(this.firestore, 'threads', threadId);
        return runInInjectionContext(this.injector, () =>
            docData(threadDocRef, { idField: 'id' }) as Observable<Thread> // <== Typisierung
        ).pipe(
            map(data => new Thread(data))
        );
    }

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

    getChannelName(threadId: string): Observable<string> {
        return runInInjectionContext(this.injector, () =>
            from(getDoc(doc(this.firestore, 'threads', threadId))).pipe(
                switchMap(threadSnap => {
                    if (threadSnap.exists()) {
                        const threadData = threadSnap.data();
                        const channelId = threadData?.['channelId'];
                        if (channelId) {
                            return runInInjectionContext(this.injector, () =>
                                from(getDoc(doc(this.firestore, 'channels', channelId))).pipe(
                                    map(channelSnap =>
                                        channelSnap.exists() ? channelSnap.data()?.['name'] || 'Unbekannt' : 'Unbekannt'
                                    )
                                ));
                        }
                    }
                    return from(Promise.resolve('Unbekannt')); // Falls kein Thread oder Channel existiert
                })
            )
        );
    }
}
