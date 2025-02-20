import { inject, Injectable } from '@angular/core';
import { Firestore, doc, docData } from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private firestore = inject(Firestore); // ✅ Korrekte Dependency Injection

    getUserById(userId: string): Observable<string> {
        const userRef = doc(this.firestore, `users/${userId}`);
        return docData(userRef).pipe(
            map((user: any) => user?.name || 'Unbekannt')
        );
    }
}
