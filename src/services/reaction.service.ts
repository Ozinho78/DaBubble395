import { Injectable } from '@angular/core';
import { Firestore, doc, setDoc, collection, collectionData, deleteDoc, addDoc, query, where, getDocs } from '@angular/fire/firestore';
import { Reaction } from '../models/reaction.class';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ReactionService {
    constructor(private firestore: Firestore) { }

    async addReaction(collectionName: string, docId: string, reaction: Reaction, parentId?: string): Promise<void> {
        const path = collectionName === 'chats' && parentId
            ? `chats/${parentId}/messages/${docId}/reactions`
            : `${collectionName}/${docId}/reactions`;

        const reactionsRef = collection(this.firestore, path);

        const q = query(reactionsRef, where('userId', '==', reaction.userId));
        const snapshot = await getDocs(q);

        for (const docSnap of snapshot.docs) {
            const existing = docSnap.data() as Reaction;

            if (existing.type === reaction.type) {
                await deleteDoc(docSnap.ref);
                return;
            } else {
                await deleteDoc(docSnap.ref);
            }
        }

        await addDoc(reactionsRef, reaction.toJSON());
    }

    getReactions(collectionName: string, docId: string, parentId?: string): Observable<Reaction[]> {
        let path: string;

        if (collectionName === 'chats' && parentId) {
            path = `chats/${parentId}/messages/${docId}/reactions`;
        } else {
            path = `${collectionName}/${docId}/reactions`;
        }

        const reactionsRef = collection(this.firestore, path);
        return collectionData(reactionsRef, { idField: 'id' }) as Observable<Reaction[]>;
    }

    async removeReaction(
        collectionName: string,
        docId: string,
        userId: string,
        emojiType: string,
        parentId?: string
    ): Promise<void> {
        const path =
            collectionName === 'chats' && parentId
                ? `chats/${parentId}/messages/${docId}/reactions`
                : `${collectionName}/${docId}/reactions`;

        const reactionsRef = collection(this.firestore, path);
        const q = query(
            reactionsRef,
            where('userId', '==', userId),
            where('type', '==', emojiType)
        );

        const snapshot = await getDocs(q);
        for (const docSnap of snapshot.docs) {
            await deleteDoc(docSnap.ref);
        }
    }
}
