export class Thread {
    channelId: string = '';
    creationDate: number | null = null;
    reactions: string[] = [];
    thread: string = '';
    userId: string = '';

    constructor(obj?: any) {
        this.channelId = obj?.channelId ?? '';
        this.creationDate = obj?.creationDate ?? null;
        this.reactions = obj?.reactions ?? [];
        this.thread = obj?.thread ?? '';
        this.userId = obj?.userId ?? '';
    }

    public toJSON() {
        return {
            channelId: this.channelId,
            creationDate: this.creationDate,
            reactions: this.reactions,
            thread: this.thread,
            userId: this.userId,
        };
    }
}
