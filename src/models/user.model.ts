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