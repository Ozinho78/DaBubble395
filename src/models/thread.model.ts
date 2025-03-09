import { MessageService } from '../services/message.service';
import { UserService } from '../services/user.service';

export class Thread {
    constructor(
        public docId: string,                   // Eindeutige DocID des Threads
        public channelId: string,               // Eindeutige DocID des Channels zu dem der Thread gehört
        public title: string,                   // Titel des Threads
        public creationDate: number,            // Erstellungsdatum des Threads
        public userId: string,                  // Ersteller des Threads; Eindeutige DocID des users
        public userName: string,
        public userAvatar: string,
        public answerCount: number,
        public lastAnswer: number
    ) { }

    toJson() {
        return {
            channelId: this.channelId,
            title: this.title,
            creationDate: this.creationDate,
            userId: this.userId
        };
    }

    static fromFirestore(docId: string, data: any, userService: UserService, messageService: MessageService) {
        const userName = userService.getUserNameById(data.userId);
        const userAvatar = userService.getUserAvatarById(data.userId);
        const answerCount = messageService.getMessageCountForThread(docId);
        const lastAnswer = messageService.getLastAnswerTimeForThread(docId);

        return new Thread(
            docId,
            data.channelId,
            data.title,
            data.creationDate,
            data.userId,
            userName,
            userAvatar,
            answerCount,
            lastAnswer
        );
    }
}