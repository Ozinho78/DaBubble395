import { inject, Injectable, Injector, runInInjectionContext } from '@angular/core';
import { Firestore, doc, setDoc, collection, collectionData, deleteDoc } from '@angular/fire/firestore';
import { Reaction } from '../models/reaction.class';
import { BehaviorSubject, map, Observable, of } from 'rxjs';
import { UserService } from '../services/user.service';

@Injectable({
    providedIn: 'root'
})
export class ReactionService {
    private injector = inject(Injector);
    private userNamesCache: { [userId: string]: string } = {};

    private showReactionsOverlaySubject = new BehaviorSubject<boolean>(false);
    showReactionsOverlaySubject$ = this.showReactionsOverlaySubject.asObservable();

    private showReactionTooltipSubject = new BehaviorSubject<boolean>(false);
    showReactionTooltip$ = this.showReactionTooltipSubject.asObservable();

    private tooltipEmojiSubject = new BehaviorSubject<string>('');
    tooltipEmoji$ = this.tooltipEmojiSubject.asObservable();

    private tooltipTextSubject = new BehaviorSubject<string>('');
    tooltipText$ = this.tooltipTextSubject.asObservable();

    constructor(
        private firestore: Firestore,
        private userService: UserService
    ) { }

    addReaction(collectionName: string, documentId: string, reaction: Reaction) {
        const reactionDocRef = doc(this.firestore, collectionName, documentId, 'reactions', reaction.userId);
        return setDoc(reactionDocRef, reaction.toJSON(), { merge: true });
    }

    getReactions(collectionName: string, documentId: string) {
        const reactionsRef = collection(this.firestore, collectionName, documentId, 'reactions');
        return runInInjectionContext(this.injector, () =>
            collectionData(reactionsRef, { idField: 'id' }) as Observable<Reaction[]>
        );
    }

    removeReaction(collectionName: string, documentId: string, userId: string) {
        const reactionDocRef = doc(this.firestore, collectionName, documentId, 'reactions', userId);
        return deleteDoc(reactionDocRef);
    }

    loadReactions(entityType: 'threads' | 'messages', entityId: string | null, currentUserId: string | null) {
        if (!entityId || !currentUserId) return of({});

        return this.getReactions(entityType, entityId).pipe(
            map(reactions => this.processReactions(reactions, currentUserId))
        );
    }

    private processReactions(reactions: any[], currentUserId: string) {
        const groupedReactions: { [type: string]: { count: number, likedByMe: boolean, userNames: string[] } } = {};

        reactions.forEach(reaction => {
            this.initializeReactionType(groupedReactions, reaction.type);
            this.incrementReactionCount(groupedReactions, reaction.type);
            this.processUserNames(reaction, groupedReactions);
            this.checkLikedByMe(reaction, groupedReactions, currentUserId);
        });

        return groupedReactions;
    }

    private initializeReactionType(groupedReactions: any, type: string) {
        if (!groupedReactions[type]) {
            groupedReactions[type] = { count: 0, likedByMe: false, userNames: [] };
        }
    }

    private incrementReactionCount(groupedReactions: any, type: string) {
        groupedReactions[type].count++;
    }

    private processUserNames(reaction: any, groupedReactions: any) {
        if (!this.userNamesCache[reaction.userId]) {
            this.userService.getUserById(reaction.userId).subscribe(userData => {
                this.cacheUserName(reaction.userId, userData.name);
                this.addUserNameToReaction(groupedReactions, reaction.type, userData.name);
            });
        } else {
            this.addUserNameToReaction(groupedReactions, reaction.type, this.userNamesCache[reaction.userId]);
        }
    }

    private cacheUserName(userId: string, name: string) {
        this.userNamesCache[userId] = name;
    }

    private addUserNameToReaction(groupedReactions: any, type: string, name: string) {
        if (!groupedReactions[type].userNames.includes(name)) {
            groupedReactions[type].userNames.push(name);
        }
    }

    private checkLikedByMe(reaction: any, groupedReactions: any, currentUserId: string) {
        if (reaction.userId === currentUserId) {
            groupedReactions[reaction.type].likedByMe = true;
        }
    }

    toggleReactionsOverlay() {
        this.showReactionsOverlaySubject.next(!this.showReactionsOverlaySubject.value);
    }

    closeReactionsOverlay() {
        this.showReactionsOverlaySubject.closed = false;
    }

    get showReactionsOverlay$() {
        return this.showReactionsOverlaySubject.asObservable();
    }

    addEmojiReaction(collectionName: string, documentId: string, userId: string, emojiType: string) {
        const reaction = new Reaction({
            userId,
            type: emojiType,
            timestamp: Date.now()
        });
        //debugger;
        this.addReaction(collectionName, documentId, reaction)
            .then(() => {
                console.log('Reaction hinzugefügt!');
                //this.closeReactionsOverlay();
                this.closeReactionTooltip();
            })
            .catch(error => console.error('Fehler beim Hinzufügen der Reaction:', error));
    }

    removeUserReaction(collectionName: string, documentId: string, userId: string) {
        this.removeReaction(collectionName, documentId, userId)
            .then(() => {
                console.log('Reaction entfernt!');
                this.closeReactionTooltip();
            })
            .catch(error => console.error('Fehler beim Entfernen der Reaction:', error));
    }

    openReactionTooltip(emoji: string, userNames: string[], currentUserName: string) {
        this.tooltipEmojiSubject.next(emoji);
        const names = userNames.map(name => (name === currentUserName ? 'Du' : name));

        if (names.length === 1) {
            this.tooltipTextSubject.next(names[0] === 'Du' ? 'Du hast reagiert' : `${names[0]} hat reagiert`);
        } else {
            this.tooltipTextSubject.next(`${names.join(' und ')} haben reagiert`);
        }

        this.showReactionTooltipSubject.next(true);
    }

    closeReactionTooltip() {
        this.tooltipEmojiSubject.next('');
        this.showReactionTooltipSubject.next(false);
    }
}
