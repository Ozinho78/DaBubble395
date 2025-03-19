import { Injectable } from '@angular/core';
import { FirestoreService } from './firestore.service';

@Injectable({
    providedIn: 'root'
})
export class MessageService {
    private messageCounts: { [threadId: string]: number } = {};
    private lastAnswerTimes: { [threadId: string]: number } = {};

    constructor(private firestoreService: FirestoreService) {
        this.loadMessageData();
    }

    /**
     * Lädt alle Nachrichten aus Firestore und speichert die Anzahl und letzte Antwortzeit pro Thread.
     */
    async loadMessageData() {
        try {
            const messages = await this.firestoreService.getData<{ threadId: string, creationDate: number }>('messages');

            this.messageCounts = {};
            this.lastAnswerTimes = {};

            messages.forEach(msg => {
                this.messageCounts[msg.threadId] = (this.messageCounts[msg.threadId] || 0) + 1;

                if (!this.lastAnswerTimes[msg.threadId] || msg.creationDate > this.lastAnswerTimes[msg.threadId]) {
                    this.lastAnswerTimes[msg.threadId] = msg.creationDate;
                }
            });
        } catch (error) {
            console.error('❌ Fehler beim Laden der Nachrichten:', error);
        }
    }

    /**
     * Gibt die Anzahl der Nachrichten für einen Thread synchron zurück.
     * Falls keine Nachrichten existieren, wird `0` zurückgegeben.
     */
    getMessageCountForThread(threadId: string): number {
        return this.messageCounts[threadId] || 0;
    }

    /**
     * Gibt den Zeitstempel der letzten Antwort für einen Thread zurück.
     */
    getLastAnswerTimeForThread(threadId: string): number {
        return this.lastAnswerTimes[threadId] || 0; // Falls keine Antworten existieren, gib 0 zurück
    }
}