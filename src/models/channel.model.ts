export class Channel {
  public docId?: string = '';
  public creationDate: Date = new Date();
  public name: string = '';
  public description: string = '';
  public member: string[] = [];
  //public reactions: string[] = [];
  public userId: string = '';

  public toJson(){
    return {
      //docId: this.docId,
      // creationDate: this.creationDate.toISOString(),
      creationDate: this.creationDate,
      name: this.name,
      description: this.description,
      member: this.member,
      //reactions: this.reactions,
      userId: this.userId
    }
  }
}