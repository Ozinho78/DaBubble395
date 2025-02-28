import { inject, Injectable, Injector, runInInjectionContext } from '@angular/core';
import { Firestore, collection, collectionData, doc, addDoc, docData, query, where } from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';
import { AuthService } from './auth.service';
import { User } from '../models/user.model';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private firestore = inject(Firestore);
    private injector = inject(Injector);
    private authService = inject(AuthService);

    user = new User();
    userData = this.authService.userData;

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

    getUserByEmail(email: string): Observable<any> {
        const usersRef = collection(this.firestore, 'users'); // Firestore Users Collection
        const queryRef = query(usersRef, where('email', '==', email));
        return collectionData(queryRef, { idField: 'uid' }).pipe(
            map(users => users.length > 0 ? users[0] : null)
        );
    }

    async createUser(): Promise<void> {
        if (!this.authService.hasUserData()) {
            console.error("Keine Benutzerinformationen gefunden!");
            return;
        }

        const { name, email, avatar } = this.authService.userData;

        const usersCollectionRef = collection(this.firestore, 'users');
        await addDoc(usersCollectionRef, {
            name,
            email,
            avatar: avatar || 'default.png'
        });

        console.log('Benutzer erfolgreich in Firestore gespeichert!');
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
