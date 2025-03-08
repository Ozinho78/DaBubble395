export class Message {
    id: string;
    creationDate: number | null = null;
    reactions: string[] = [];
    text: string = '';
    threadId: string = '';
    userId: string = '';

    constructor(obj?: any) {
        this.id = obj?.id;
        this.creationDate = obj?.creationDate ?? null;
        this.reactions = obj?.reactions ?? [];
        this.text = obj?.text ?? '';
        this.threadId = obj?.threadId ?? '';
        this.userId = obj?.userId ?? '';
    }

    public toJSON() {
        return {
            creationDate: this.creationDate,
            reactions: this.reactions,
            text: this.text,
            threadId: this.threadId,
            userId: this.userId
        };
    }
}
