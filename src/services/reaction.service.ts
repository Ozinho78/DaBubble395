import { Injectable } from '@angular/core';
import { Firestore, doc, setDoc, collection, collectionData, deleteDoc } from '@angular/fire/firestore';
import { Reaction } from '../models/reaction.class';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ReactionService {
    constructor(private firestore: Firestore) { }

    // Fügt (oder aktualisiert) eine Reaction in der Subcollection 'reactions' unter dem angegebenen Dokument (z. B. Message oder Thread)
    addReaction(collectionName: string, documentId: string, reaction: Reaction): Promise<void> {
        const reactionDocRef = doc(this.firestore, collectionName, documentId, 'reactions', reaction.userId);
        return setDoc(reactionDocRef, reaction.toJSON(), { merge: true });
    }

    // Holt alle Reaktionen für ein bestimmtes Dokument (z. B. Message oder Thread)
    getReactions(collectionName: string, documentId: string): Observable<Reaction[]> {
        const reactionsRef = collection(this.firestore, collectionName, documentId, 'reactions');
        return collectionData(reactionsRef, { idField: 'id' }) as Observable<Reaction[]>;
    }

    removeReaction(collectionName: string, documentId: string, userId: string): Promise<void> {
        const reactionDocRef = doc(this.firestore, collectionName, documentId, 'reactions', userId);
        return deleteDoc(reactionDocRef);
    }
}
