export class Channel {
	constructor(
		public docId: string,                   // Eindeutige DocID des Channels
		public name: string,                    // Name des Channels
		public description: string,             // Beschreibung des Channels
		public member: string[] = [],           // Mitglieder des Channels
		public creationDate: string,            // Erstellungsdatum des Channels
		public userId: string                   // Ersteller des Channels; Eindeutige DocID des users
	) { }

	toJson() {
		return {
			name: this.name,
			description: this.description,
			member: this.member,
			creationDate: this.creationDate,
			userId: this.userId
		};
	}

	static fromFirestore(docId: string, data: any): Channel {
		return new Channel(
			docId,
			data.name,
			data.description,
			data.member || [],
			data.creationDate,
			data.userId
		);
	}
}
