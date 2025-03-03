import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
} from "./IInsightFacade";
import JSZip from "jszip";
import { Dataset, Section, Room } from "./insightTypes";
import fs from "fs-extra";
import { QueryManager } from "./QueryManager";
import SectionsManager from "./SectionsManager";
import RoomsManager from "./RoomsManager";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
const dataFile = "data/datasets.json";
export default class InsightFacade implements IInsightFacade {
	private static async loadDataset(path: string): Promise<Dataset[]> {
		try {
			return await fs.readJson(path);
		} catch {
			return [];
		}
	}

	private static async readFile(content: string): Promise<JSZip> {
		const jszip = new JSZip();
		try {
			return await jszip.loadAsync(content, { base64: true });
		} catch (err) {
			throw new InsightError(err instanceof Error ? err.message + " error" : "error");
		}
	}

	public async addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		const sectionsManager = new SectionsManager();
		const roomsManager = new RoomsManager();
		if (kind !== InsightDatasetKind.Sections && kind !== InsightDatasetKind.Rooms) {
			throw new InsightError("invalid kind");
		}
		const datasets: Dataset[] = await InsightFacade.loadDataset(dataFile);

		//  for each dataset, check dataset.id.trim() === id???
		//  eg: "a" exists in database, add "a ", does this count as duplicate?
		if (datasets.some((dataset) => dataset.id.trim() === id) || id.trim() === "" || id.includes("_")) {
			throw new InsightError("invalid id");
		}

		const data: JSZip = await InsightFacade.readFile(content);
		//console.log(data);

		// handle courses/sections
		let result: Section[] | Room[];
		if (kind === InsightDatasetKind.Sections) {
			result = await sectionsManager.processSections(data);
		}
		// handle buildings/rooms
		else {
			result = await roomsManager.processRooms(data, id);
		}

		datasets.push({ id: id.trim(), kind: kind, data: result, numRows: result.length });
		await fs.outputJSON(dataFile, datasets);
		return datasets.map((dataset) => dataset.id);
	}

	public async removeDataset(id: string): Promise<string> {
		if (id.trim() === "" || id.includes("_")) {
			throw new InsightError("invalid id");
		}
		let datasets: Dataset[] = await InsightFacade.loadDataset(dataFile);

		if (!datasets.some((dataset) => dataset.id === id)) {
			throw new NotFoundError("dataset not found!");
		}

		datasets = datasets.filter((dataset) => {
			return dataset.id !== id;
		});

		await fs.outputJSON(dataFile, datasets);

		return id;
	}

	public async performQuery(query: unknown): Promise<InsightResult[]> {
		const queryManager = new QueryManager(query);
		return queryManager.performQuery();
	}

	public async listDatasets(): Promise<InsightDataset[]> {
		const datasets: Dataset[] = await InsightFacade.loadDataset(dataFile);
		return datasets.map((dataset) => {
			return { id: dataset.id, kind: dataset.kind, numRows: dataset.numRows };
		});
	}
}
