import { Injectable } from '@angular/core';
import { Firestore, doc, setDoc, collection, collectionData } from '@angular/fire/firestore';
import { Reaction } from '../models/reaction.class';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ReactionService {
    constructor(private firestore: Firestore) { }

    // Fügt (oder aktualisiert) eine Reaction in der Subcollection 'reactions' unter der Message
    addReaction(messageId: string, reaction: Reaction): Promise<void> {
        // Verwende die userId als Dokument-ID
        const reactionDocRef = doc(this.firestore, 'messages', messageId, 'reactions', reaction.userId);
        return setDoc(reactionDocRef, reaction.toJSON(), { merge: true });
    }

    // Holt alle Reaktionen für eine bestimmte Message
    getReactions(messageId: string): Observable<Reaction[]> {
        const reactionsRef = collection(this.firestore, 'messages', messageId, 'reactions');
        return collectionData(reactionsRef, { idField: 'id' }) as Observable<Reaction[]>;
    }
}
