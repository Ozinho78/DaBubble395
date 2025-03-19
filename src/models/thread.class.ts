import { UserService } from '../services/user.service';
import { MessageService } from '../services/message.service';

export class Thread {
    docId: string = '';
    id: string = '';
    channelId: string = '';
    creationDate: number | null = null;
    thread: string = '';
    userId: string = '';
    userName: string = '';
    userAvatar: string = '';
    answerCount: number = 0;
    lastAnswer: number = 0;

    constructor(
        obj?: any,
        userService?: UserService,
        messageService?: MessageService
    ) {
        this.docId = obj?.docId ?? '';
        this.id = obj?.id ?? '';
        this.channelId = obj?.channelId ?? '';
        this.creationDate = obj?.creationDate ?? null;
        this.thread = obj?.thread ?? '';
        this.userId = obj?.userId ?? '';

        if (userService) {
            this.userName = userService.getUserNameById(this.userId);
            this.userAvatar = userService.getUserAvatarById(this.userId);
        }

        if (messageService) {
            this.answerCount = messageService.getMessageCountForThread(this.docId);
            this.lastAnswer = messageService.getLastAnswerTimeForThread(this.docId);
        }
    }

    public toJSON() {
        return {
            channelId: this.channelId,
            creationDate: this.creationDate,
            thread: this.thread,
            userId: this.userId,
        };
    }
}
