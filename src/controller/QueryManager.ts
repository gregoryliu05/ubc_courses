import { Query } from "./insightTypes";
import {InsightError, InsightResult} from "./IInsightFacade";
import {validate} from "./QueryValidator";

export class QueryManager {
	private query: Query;

	constructor(query: unknown) {
		this.query = query as Query;
	}

	public getQuery(): Query {
		return this.query;
	}

	public async performQuery(): Promise<InsightResult[]> {
		try {
			validate(this.query);
		} catch (e) {
			if (e instanceof InsightError) {
				throw e;
			}
			throw new InsightError("An unexpected error occurred while validating the query");
		}
		return Promise.resolve([]);
	}

}
