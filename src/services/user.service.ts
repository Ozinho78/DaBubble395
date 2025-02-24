import { inject, Injectable, Injector, runInInjectionContext } from '@angular/core';
import { Firestore, doc, docData } from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private firestore = inject(Firestore);
    private injector = inject(Injector);

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
}
