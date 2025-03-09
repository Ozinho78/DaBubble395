export class Reaction {
    userId: string;
    type: string;
    timestamp: number;
  
    constructor(data?: any) {
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
  