/*
export class User {
  public id?: number = 0;
  public docId?: string = '';
  public avatar: string = '';
  public name: string = '';
  public email: string = '';
  public password: string = '';
  public active: boolean = false;


  public toJson(){
    return {
      id: this.id,
      docId: this.docId,
      avatar: this.avatar,
      name: this.name,
      email: this.email,
      password: this.password,
      active: this.active
    }
  }
}
*/

export class User {
    constructor(
        public docId: string,                   // Eindeutige DocID des Users
        public name: string,                    // Name des Users
        public email: string,                   // Email des Users
        public avatar: string                   // Avatar des Users
    ) { }

    toJson() {
        return {
            docId: this.docId,
            name: this.name,
            email: this.email,
            avatar: this.avatar
        };
    }

    static fromFirestore(docId: string, data: any): User {
        return new User(
            docId,
            data.name,
            data.email,
            data.avatar
        );
    }
}
