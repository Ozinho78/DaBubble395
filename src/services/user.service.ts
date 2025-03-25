import {
    inject,
    Injectable,
    Injector,
    runInInjectionContext,
} from '@angular/core';
import {
    Firestore,
    getDocs,
    collection,
    collectionData,
    doc,
    addDoc,
    docData,
    query,
    where,
    getDoc,
} from '@angular/fire/firestore';
import { BehaviorSubject, Observable, firstValueFrom, map } from 'rxjs';
import { AuthService } from './auth.service';
import { User } from '../models/user.model';
import { FirestoreService } from './firestore.service';

@Injectable({
    providedIn: 'root',
})
export class UserService {
    private firestore = inject(Firestore);
    private injector = inject(Injector);
    private authService = inject(AuthService);
    private docIdFromDevSpace = new BehaviorSubject<string | null>(null);
    private channelIdFromDevSpace = new BehaviorSubject<string | null>(null);
    currentDocIdFromDevSpace = this.docIdFromDevSpace.asObservable();
    currentChannelIdFromDevSpace = this.channelIdFromDevSpace.asObservable();

    private currentUser: any = null;

    user = new User();
    userData = this.authService.userData;

    private channelId: string | null = null;
    public userArray: User[] = [];

    constructor(private firestoreService: FirestoreService) { }

    getUserById(userId: string): Observable<{ id: string; name: string; avatar: string; email: string }> {
        const cachedUser = this.userArray.find(user => user.docId === userId);

        if (cachedUser) {
            return new Observable(observer => {
                observer.next({
                    id: cachedUser.id?.toLocaleString() || '',
                    name: cachedUser.name || 'Unbekannt',
                    avatar: cachedUser.avatar ? `img/avatar/${cachedUser.avatar}` : 'img/avatar/default.png',
                    email: cachedUser.email || '',
                });
                observer.complete();
            });
        }
        const userRef = doc(this.firestore, `users/${userId}`);
        return docData(userRef).pipe(
            map((user: any) => {
                return {
                    id: userId,
                    name: user?.name || 'Unbekannt',
                    avatar: user?.avatar ? `img/avatar/${user.avatar}` : 'img/avatar/default.png',
                    email: user?.email || '',
                };
            })
        );
    }

    getUserByEmail(email: string): Observable<any> {
        const usersRef = collection(this.firestore, 'users'); // Firestore Users Collection
        const queryRef = query(usersRef, where('email', '==', email));
        return collectionData(queryRef, { idField: 'uid' }).pipe(
            map((users) => (users.length > 0 ? users[0] : null))
        );
    }

    async createUser(): Promise<void> {
        if (!this.authService.hasUserData()) {
            console.error('Keine Benutzerinformationen gefunden!');
            return;
        }

        const { name, email, avatar } = this.authService.userData;

        const usersCollectionRef = collection(this.firestore, 'users');
        await addDoc(usersCollectionRef, {
            name,
            email,
            avatar: avatar || 'default.png',
        });

        console.log('Benutzer erfolgreich in Firestore gespeichert!');
    }

    /** Holt alle Nutzer aus der Firestore `users`-Sammlung */
    getAllUsers(): Observable<{ name: string; avatar: string; id: string }[]> {
        const usersRef = collection(this.firestore, 'users');

        return runInInjectionContext(
            this.injector,
            () => collectionData(usersRef, { idField: 'id' }) as Observable<any[]>
        ).pipe(
            map((users) =>
                users.map((user) => ({
                    id: user.id,
                    name: user?.name || 'Unbekannt',
                    avatar: user?.avatar
                        ? `img/avatar/${user.avatar}`
                        : 'img/avatar/default.png',
                }))
            )
        );
    }

    async saveUserDocIdByEmail(email: string): Promise<void> {
        try {
            const usersCollection = collection(this.firestore, 'users');

            // Query: Suche nach dem User mit der passenden Email
            const q = query(usersCollection, where('email', '==', email));
            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
                const userDoc = snapshot.docs[0];
                const docId = userDoc.id;
                localStorage.setItem('user-id', docId);
            } else {
                console.error('Kein Benutzer mit dieser E-Mail gefunden.');
            }
        } catch (error) {
            console.error('Fehler beim Abrufen des Users:', error);
        }
    }

    getCurrentUserId(): string | null {
        return localStorage.getItem('user-id');
    }

    async loadCurrentUser(userId: string) {
        if (this.currentUser) return this.currentUser;

        const userDocRef = doc(this.firestore, 'users', userId);
        const userSnap = await getDoc(userDocRef);

        if (userSnap.exists()) {
            this.currentUser = userSnap.data();
            return this.currentUser;
        } else {
            console.error('User nicht gefunden.');
            return null;
        }
    }

    // aktualisiert die gespeicherte docId aus DevSpace
    // next(id) setzt einen neuen Wert, wodurch alle abonnierten Komponenten automatisch informiert werden
    setDocIdFromDevSpace(id: string) {
        this.docIdFromDevSpace.next(id);
    }

    /*
    setChannelIdFromDevSpace(id: string) {
      this.channelIdFromDevSpace.next(id);
    }*/

    /**
    * Lädt alle User aus Firestore und speichert sie lokal.
    */
    async loadUsers() {
        try {
            this.userArray = await this.firestoreService.getData<User>('users');
        } catch (error) {
            console.error('❌ Fehler beim Laden der User:', error);
        }
        console.log(this.userArray);
    }

    /**
     * Gibt den Namen eines Users anhand der `userId` zurück.
     * Falls der User nicht existiert, wird `"Unbekannter Benutzer"` zurückgegeben.
     * @param userId Die Firestore-User-ID
     * @returns Der Benutzername oder `"Unbekannter Benutzer"`
     */
    getUserNameById(userId: string) {
        const userArray = this.userArray.find(u => u.docId === userId);
        return userArray ? userArray.name : 'Unbekannter Benutzer';
    }

    getUserAvatarById(userId: string) {
        const userArray = this.userArray.find(u => u.docId === userId);
        return userArray ? userArray.avatar : 'Unbekannter Avatar';
    }

    setChannelIdFromDevSpace(channelId: string) {
        this.channelId = channelId;
    }

    getChannelIdFromDevSpace(): string | null {
        return this.channelId;
    }
}
