import { inject, Injectable, Injector, runInInjectionContext } from '@angular/core';
import { Firestore, collection, collectionData, doc, docData } from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private firestore = inject(Firestore);
    private injector = inject(Injector);

    /** Holt einen einzelnen Nutzer anhand der ID */
    getUserById(userId: string): Observable<{ name: string, avatar: string }> {
        const userRef = doc(this.firestore, `users/${userId}`);

        return runInInjectionContext(this.injector, () =>
            docData(userRef) as Observable<any>
        ).pipe(
            map((user: any) => ({
                name: user?.name || 'Unbekannt',
                avatar: user?.avatar ? `/img/avatar/${user.avatar}` : '/img/avatar/default.png'
            }))
        );
    }

    /** Holt alle Nutzer aus der Firestore `users`-Sammlung */
    getAllUsers(): Observable<{ name: string, avatar: string, id: string }[]> {
        const usersRef = collection(this.firestore, 'users');

        return runInInjectionContext(this.injector, () =>
            collectionData(usersRef, { idField: 'id' }) as Observable<any[]>
        ).pipe(
            map(users =>
                users.map(user => ({
                    id: user.id,
                    name: user?.name || 'Unbekannt',
                    avatar: user?.avatar ? `/img/avatar/${user.avatar}` : '/img/avatar/default.png'
                }))
            )
        );
    }
}
