export type SearchResult =
  | {
      type: 'thread';
      title: string;
      threadId: string;
      channelId: string;
      channelName: string;
    }
  | {
      type: 'message';
      text: string;
      threadId: string;
      channelId: string;
      channelName: string;
      userId: string;
      creationDate: number;
    };