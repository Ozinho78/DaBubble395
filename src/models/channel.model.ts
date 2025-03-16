export class Channel {
  public docId?: string = '';
  // public creationDate: Date = new Date();
  // public creationDate: string = (new Date().getTime() * 1000).toString();
  public creationDate: string = new Date().getTime().toString();
  public name: string = '';
  public description: string = '';
  public member: string[] = [];
  public userId: string = '';

  public toJson(){
    return {
      creationDate: this.creationDate,
      name: this.name,
      description: this.description,
      member: this.member,
      userId: this.userId
    }
  }
}