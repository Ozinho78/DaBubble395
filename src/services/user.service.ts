import { Injectable } from '@angular/core';
import { Firestore, collection, doc, docData } from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';

export interface User {
    id: string;
    name: string;
}

@Injectable({
    providedIn: 'root'
})
export class UserService {
    constructor(private firestore: Firestore) { }

    getUserById(userId: string): Observable<string> {
        const userRef = doc(this.firestore, `users/${userId}`);
        return docData(userRef).pipe(
            map((user: any) => user?.name || 'Unbekannt')
        );
    }
}