import { inject, Injectable, Injector, runInInjectionContext } from '@angular/core';
import { Firestore, doc, setDoc, collection, collectionData, deleteDoc } from '@angular/fire/firestore';
import { Reaction } from '../models/reaction.class';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ReactionService {
    private injector = inject(Injector);

    constructor(private firestore: Firestore) { }

    addReaction(collectionName: string, documentId: string, reaction: Reaction): Promise<void> {
        const reactionDocRef = doc(this.firestore, collectionName, documentId, 'reactions', reaction.userId);
        return setDoc(reactionDocRef, reaction.toJSON(), { merge: true });
    }

    getReactions(collectionName: string, documentId: string): Observable<Reaction[]> {
        const reactionsRef = collection(this.firestore, collectionName, documentId, 'reactions');
        return runInInjectionContext(this.injector, () =>
            collectionData(reactionsRef, { idField: 'id' }) as Observable<Reaction[]>
        );
    }

    removeReaction(collectionName: string, documentId: string, userId: string): Promise<void> {
        const reactionDocRef = doc(this.firestore, collectionName, documentId, 'reactions', userId);
        return deleteDoc(reactionDocRef);
    }
}
