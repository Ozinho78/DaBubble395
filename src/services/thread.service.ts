import { inject, Injectable } from '@angular/core';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Message } from '../models/message.class';

@Injectable({
    providedIn: 'root'
})
export class ThreadService {
    private firestore = inject(Firestore);

    getMessages(threadId: string): Observable<Message[]> {
        const messagesRef = collection(this.firestore, 'messages');
        return collectionData(messagesRef) as Observable<Message[]>;
    }
}
