import { inject, Injectable } from '@angular/core';
import { Firestore, doc, docData } from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private firestore = inject(Firestore);

    getUserById(userId: string): Observable<{ name: string, avatar: string }> {
        const userRef = doc(this.firestore, `users/${userId}`);
        return docData(userRef).pipe(
            map((user: any) => {
                const result = {
                    name: user?.name || 'Unbekannt',
                    avatar: user?.avatar ? `/img/avatar/${user.avatar}` : '/img/avatar/default.png'
                };
                console.log('User data for', userId, ':', result);
                return result;
            })
        );
    }

}
