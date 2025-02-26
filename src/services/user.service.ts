import { inject, Injectable, Injector, runInInjectionContext } from '@angular/core';
import { Firestore, doc, addDoc, docData, collection } from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';
import { AuthService } from './auth.service';
import { User } from '../app/models/user.model';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private firestore = inject(Firestore);
    private injector = inject(Injector);
    private authService = inject(AuthService);

    user = new User();
    userData = this.authService.userData;

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

    async createUser(): Promise<void> {
        const usersCollectionRef = collection(this.firestore, 'users');
        await addDoc(usersCollectionRef, this.user.toJson());
    }
}
