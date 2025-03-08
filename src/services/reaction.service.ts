import { inject, Injectable, Injector, runInInjectionContext } from '@angular/core';
import { Firestore, doc, setDoc, collection, collectionData, deleteDoc } from '@angular/fire/firestore';
import { Reaction } from '../models/reaction.class';
import { map, Observable, of, BehaviorSubject } from 'rxjs';
import { UserService } from '../services/user.service';

@Injectable({
    providedIn: 'root'
})
export class ReactionService {
    private injector = inject(Injector);
    private userNamesCache: { [userId: string]: string } = {};

    private showReactionsOverlaySubject = new BehaviorSubject<boolean>(false);
    private showReactionTooltipSubject = new BehaviorSubject<boolean>(false);
    private tooltipEmojiSubject = new BehaviorSubject<string>('');
    private tooltipTextSubject = new BehaviorSubject<string>('');

    constructor(
        private firestore: Firestore,
        private userService: UserService
    ) { }

    addReaction(collectionName: string, documentId: string, reaction: Reaction): Promise<void> {
        const reactionDocRef = doc(this.firestore, collectionName, documentId, 'reactions', reaction.userId);
        return setDoc(reactionDocRef, reaction.toJSON(), { merge: true });
    }

    getReactions(collectionName: string, documentId: string): Observable<Reaction[]> {
        if (!documentId) return of([]); // Falls documentId nicht existiert, leere Liste zurückgeben
        const reactionsRef = collection(this.firestore, collectionName, documentId, 'reactions');
        return runInInjectionContext(this.injector, () =>
            collectionData(reactionsRef, { idField: 'id' }) as Observable<Reaction[]>
        );
    }

    removeReaction(collectionName: string, documentId: string, userId: string): Promise<void> {
        const reactionDocRef = doc(this.firestore, collectionName, documentId, 'reactions', userId);
        return deleteDoc(reactionDocRef);
    }

    loadReactions(
        entityType: 'threads' | 'messages',
        entityId: string | null,
        currentUserId: string | null
    ): Observable<{ [type: string]: { count: number, likedByMe: boolean, userNames: string[] } }> {
        if (!entityId || !currentUserId) return of({}); // Falls `entityId` oder `currentUserId` null ist, leeres Objekt zurückgeben

        return this.getReactions(entityType, entityId).pipe(
            map(reactions => {
                const groupedReactions: { [type: string]: { count: number, likedByMe: boolean, userNames: string[] } } = {};

                reactions.forEach(reaction => {
                    if (!groupedReactions[reaction.type]) {
                        groupedReactions[reaction.type] = { count: 0, likedByMe: false, userNames: [] };
                    }
                    groupedReactions[reaction.type].count++;

                    // Benutzername cachen und hinzufügen
                    if (!this.userNamesCache[reaction.userId]) {
                        this.userService.getUserById(reaction.userId).subscribe(userData => {
                            this.userNamesCache[reaction.userId] = userData.name;
                            if (!groupedReactions[reaction.type].userNames.includes(userData.name)) {
                                groupedReactions[reaction.type].userNames.push(userData.name);
                            }
                        });
                    } else {
                        const name = this.userNamesCache[reaction.userId];
                        if (!groupedReactions[reaction.type].userNames.includes(name)) {
                            groupedReactions[reaction.type].userNames.push(name);
                        }
                    }

                    if (reaction.userId === currentUserId) {
                        groupedReactions[reaction.type].likedByMe = true;
                    }
                });

                return groupedReactions;
            })
        );
    }

    // Toggle Reactions Overlay
    toggleReactionsOverlay(): void {
        this.showReactionsOverlaySubject.next(!this.showReactionsOverlaySubject.value);
    }

    get showReactionsOverlay$(): Observable<boolean> {
        return this.showReactionsOverlaySubject.asObservable();
    }

    // Emoji hinzufügen
    addEmojiReaction(collectionName: string, documentId: string, userId: string, emojiType: string): void {
        const reaction = new Reaction({
            userId,
            type: emojiType,
            timestamp: Date.now()
        });

        this.addReaction(collectionName, documentId, reaction)
            .then(() => {
                console.log('Reaction hinzugefügt!');
                this.toggleReactionsOverlay(); // Schließt Overlay nach der Reaktion
            })
            .catch(error => console.error('Fehler beim Hinzufügen der Reaction:', error));
    }

    // Reaction entfernen
    removeUserReaction(collectionName: string, documentId: string, userId: string): void {
        this.removeReaction(collectionName, documentId, userId)
            .then(() => {
                console.log('Reaction entfernt!');
                this.toggleReactionsOverlay(); // Overlay schließen
            })
            .catch(error => console.error('Fehler beim Entfernen der Reaction:', error));
    }

    // Tooltip öffnen
    openReactionTooltip(emoji: string, userNames: string[], currentUserName: string): void {
        this.tooltipEmojiSubject.next(emoji);
        const names = userNames.map(name => (name === currentUserName ? 'Du' : name));

        if (names.length === 1) {
            this.tooltipTextSubject.next(names[0] === 'Du' ? 'Du hast reagiert' : `${names[0]} hat reagiert`);
        } else {
            this.tooltipTextSubject.next(`${names.join(' und ')} haben reagiert`);
        }

        this.showReactionTooltipSubject.next(true);
    }

    // Tooltip schließen
    closeReactionTooltip(): void {
        this.showReactionTooltipSubject.next(false);
    }

    get showReactionTooltip$(): Observable<boolean> {
        return this.showReactionTooltipSubject.asObservable();
    }

    get tooltipEmoji$(): Observable<string> {
        return this.tooltipEmojiSubject.asObservable();
    }

    get tooltipText$(): Observable<string> {
        return this.tooltipTextSubject.asObservable();
    }
}
