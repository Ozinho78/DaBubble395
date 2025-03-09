export class Message {
    constructor(
        public docId: string,                   // Eindeutige DocID der Nachricht
        public threadId: string,                // Eindeutige DocID des Threads zu dem die Nachricht gehört
        public text: string,                    // Der Nachrichtentext
        public creationDate: string,            // Erstellungsdatum des Nachricht
        public userId: string                   // Der Absender der Nachricht
    ) { }

    toJson() {
        return {
            threadId: this.threadId,
            text: this.text,
            creationDate: this.creationDate,
            userId: this.userId
        };
    }

    static fromFirestore(docId: string, data: any): Message {
        return new Message(
            docId,
            data.threadId,
            data.text,
            data.creationDate,
            data.userId
        );
    }
}