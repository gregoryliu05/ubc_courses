import {Query} from "./insightTypes";

export class QueryManager {

	private query: Query;

	constructor(query: unknown) {
		this.query = query as Query;
	}

	public getQuery(): Query {
		return this.query;
	}

}
