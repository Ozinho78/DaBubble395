export class Thread {
    constructor(
        public docId: string,                   // Eindeutige DocID des Threads
        public channelId: string,               // Eindeutige DocID des Channels zu dem der Thread gehört
        public title: string,                   // Titel des Threads
        public creationDate: string,            // Erstellungsdatum des Threads
        public userId: string                   // Ersteller des Threads; Eindeutige DocID des users
    ) { }

    toJson() {
        return {
            channelId: this.channelId,
            title: this.title,
            creationDate: this.creationDate,
            userId: this.userId
        };
    }

    static fromFirestore(docId: string, data: any): Thread {
        return new Thread(
            docId,
            data.channelId,
            data.title,
            data.creationDate,
            data.userId
        );
    }
}