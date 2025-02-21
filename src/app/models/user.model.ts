export class User {
  public avatar: string = '';
  public name: string = '';
  public email: string = '';
  public password: string = '';


  public toJson(){
    return {
      avatar: this.avatar,
      name: this.name,
      email: this.email,
      password: this.password
    }
  }

}