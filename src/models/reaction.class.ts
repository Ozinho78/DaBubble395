export class Reaction {
    id: string;
    userId: string;
    type: string;
    timestamp: number;

    constructor(data?: any) {
        this.id = '';
        this.userId = data?.userId || '';
        this.type = data?.type || '';
        this.timestamp = data?.timestamp || Date.now();
    }

    toJSON() {
        return {
            userId: this.userId,
            type: this.type,
            timestamp: this.timestamp
        };
    }
}
