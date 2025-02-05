import { Query } from "./insightTypes";
import { InsightError, InsightResult } from "./IInsightFacade";
import { validate } from "./QueryValidator";
import fs from "fs-extra";
import {applyFilter} from "./QueryExecutor";

export class QueryManager {
	private query: Query;
	private ids: string[];
	private dataFile = "data/datasets.json";


	constructor(query: unknown) {
		this.query = query as Query;
		this.ids = [];
	}

	public getQuery(): Query {
		return this.query;
	}

	public async performQuery(): Promise<InsightResult[]> {
		try {
			validate(this.query, this.ids);
		} catch (e) {
			if (e instanceof InsightError) {
				throw e;
			}
			throw new InsightError("An unexpected error occurred while validating the query");
		}
		const dataset = await this.getDataset(ids[0]);

		const filter = this.query.WHERE;

		let result: InsightResult = [];

		if (Object.keys(filter).length === 0) {
			result = dataset;
		} else {
			for (const section of dataset) {
				if (applyFilter(section as Section, filter as Filter)) {
					result.push(section);
				}
			}
		}

		return Promise.resolve(result);
	}

	private async getDataset(id: string): Promise<InsightResult[]> {
		try {
			const datasets: InsightResult[] = await fs.readJson(this.dataFile);
			for (const dataset of datasets) {
				if (dataset.id === id) {
					return dataset.data as InsightResult[];
				}
			}
			throw new InsightError(`Could not find dataset with id: ${id}`);
		} catch {
			throw new InsightError(`Error reading data`);
		}
	}
}
