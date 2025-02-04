import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError
} from "./IInsightFacade";
import JSZip, {JSZipObject} from "jszip";
import {CourseInfo, Dataset, Section} from "./insightTypes";
import fs from "fs-extra";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
const dataFile = "data/datasets.json";
export default class InsightFacade implements IInsightFacade {
	private static jszip = new JSZip();

	private static async loadDataset(path: string): Promise<Dataset[]> {
		try {
			return await fs.readJson(path);
		} catch (err) {
			console.log(err);
			return [];
		}
	}

	private static getValidCourses(data: JSZip): JSZipObject[] {
		const minLength = 8;
		const courses: JSZipObject[] = [];
		Object.entries(data.files).forEach(([name, object]) => {
			if (name.includes("courses/") && !name.includes("__MACOSX") && name.length > minLength) {
				courses.push(object);
			}
		});
		return courses;
	}

	private static async readFile(content: string): Promise<JSZip> {
		try {
			return await InsightFacade.jszip.loadAsync(content, { base64: true });
		} catch (err) {
			throw new InsightError(err instanceof Error ? (err.message + " error") : "error");
		}
	}

	private static async getValidSections(courses: JSZipObject[], id: string): Promise<Section[]> {
		const sections: Section[] = [];
		const defaultYear = 1900;

		const courseInfos: string[] = await Promise.all(
			courses.map(async (course: JSZipObject): Promise<string> => course.async("text"))
		);

		for (const course of courseInfos) {
			try {
				JSON.parse(course).result.forEach((courseInfo: CourseInfo) => {
					const section: Section = {
						uuid: courseInfo.id.toString(),
						id: id,
						title: courseInfo.Title,
						instructor: courseInfo.Professor,
						dept: courseInfo.Subject,
						year: courseInfo.Section === "overall" ? defaultYear : parseInt(courseInfo.Year),
						avg: courseInfo.Avg,
						pass: courseInfo.Pass,
						fail: courseInfo.Fail,
						audit: courseInfo.Audit,
					};

					const check: Boolean = Object.values(section).every((val) => val !== null && val !== undefined);
					if (check) {
						sections.push(section);
					}
				});
			} catch (err) {
				throw new InsightError(err instanceof Error ? (err.message + " error") : "error");
			}
		}
		return sections;
	}

	public async addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		// TODO: then write the tests
		if (kind !== InsightDatasetKind.Sections) {
			throw new InsightError("invalid kind");
		}

		const datasets: Dataset[] = await InsightFacade.loadDataset(dataFile);

		if (datasets.some((dataset) => dataset.id === id) || id.trim() === "" || id.includes("_")) {
			throw new InsightError("invalid id");
		}

		const data: JSZip = await InsightFacade.readFile(content);
		if (!data) {
			throw new InsightError("empty dataset");
		}

		const courses: JSZipObject[] = InsightFacade.getValidCourses(data);
		if (courses.length === 0) {
			throw new InsightError("no valid courses");
		}

		const sections: Section[] = await InsightFacade.getValidSections(courses, id);


		if (sections.length === 0) {
			throw new InsightError("no valid sections");
		}

		datasets.push({ id: id, kind: kind, data: sections, numRows: sections.length });

		await fs.outputJSON(dataFile, datasets);
		return datasets.map((dataset) => dataset.id);
	}

	public async removeDataset(id: string): Promise<string> {
		if (id.trim() === "" || id.includes("_")) {
			throw new InsightError("invalid id");
		}
		let datasets: Dataset[] = await InsightFacade.loadDataset(dataFile);

		if (!datasets.some((dataset) => dataset.id === id)) {
			throw new NotFoundError("dataset not found!")
		}

		datasets = datasets.filter((dataset) => {
			return dataset.id !== id
		})

		await fs.outputJSON(dataFile, datasets);

		return id;
	}

	public async performQuery(query: unknown): Promise<InsightResult[]> {
		// TODO: Remove this once you implement the methods!
		throw new Error(`InsightFacadeImpl::performQuery() is unimplemented! - query=${query};`);
	}

	public async listDatasets(): Promise<InsightDataset[]> {
		// TODO: Remove this once you implement the methods!
		// TODO:
		const datasets: Dataset[] = await InsightFacade.loadDataset(dataFile);
		return datasets.map((dataset) => {
			return {id: dataset.id, kind: dataset.kind, numRows: dataset.numRows}
		})
	}
}
