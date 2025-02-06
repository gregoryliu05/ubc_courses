import { Dataset, Filter, Query, Section } from "./insightTypes";
import { InsightError, InsightResult, ResultTooLargeError } from "./IInsightFacade";
import { validate } from "./QueryValidator";
import fs from "fs-extra";
import { applyFilter, filterColumns, sortResult } from "./QueryExecutor";

const maxResults: number = 5000;
const dataFile = "data/datasets.json";
export class QueryManager {
	private query: Query;
	private ids: string[];

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
		const dataset = await this.getDataset(this.ids[0]);

		const filter = this.query.WHERE;
		let result: InsightResult[] = [];

		if (Object.keys(filter).length === 0) {
			result = dataset;
		} else {
			for (const section of dataset) {
				if (applyFilter(section as unknown as Section, filter as Filter)) {
					result.push(section);
				}
			}
		}

		if (result.length > maxResults) {
			return Promise.reject(new ResultTooLargeError("Over 5000 results found"));
		}

		filterColumns(result, this.query.OPTIONS.COLUMNS as string[]);

		if (this.query.OPTIONS.ORDER) {
			sortResult(result, this.query.OPTIONS.ORDER);
		}

		return Promise.resolve(result);
	}

	private async getDataset(id: string): Promise<InsightResult[]> {
		try {
			const datasets: Dataset[] = await fs.readJson(dataFile);
			for (const dataset of datasets) {
				if (dataset.id === id) {
					return dataset.data as unknown as InsightResult[];
				}
			}
			throw new InsightError(`Could not find dataset with id: ${id}`);
		} catch (e) {
			if (e instanceof InsightError) {
				throw e;
			} else {
				throw new InsightError("Error reading data");
			}
		}
	}
}
