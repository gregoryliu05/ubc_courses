import { IInsightFacade, InsightDataset, InsightDatasetKind, InsightResult } from "./IInsightFacade";
import JSZip, { JSZipObject } from "jszip";
import { CourseInfo, Section } from "./insightTypes";
require("jszip");

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
	// method for loading the dataset
	// method for validating the data within the dataset and adding it to the json
	// i need to get the current data
	// then add all the current sections
	private jszip = new JSZip();

	private getValidCourses(data: JSZip): JSZipObject[] {
		let courses: JSZipObject[] = [];
		Object.entries(data.files).forEach(([name, object]) => {
			if (name.includes("courses/") && !name.includes("__MACOSX") && name.length > 8) {
				courses.push(object);
			}
		});
		return courses;
	}

	public async addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		// TODO: do validation, like to check if the id is valid or kind is valid or content is valid
		// TODO: learn how to parse the data
		// TODO: then write the tests
		const data = await this.jszip.loadAsync(content, { base64: true });
		let courses: JSZipObject[] = this.getValidCourses(data);
		let sections: Section[] = [];

		for (const course of courses) {
			const info = await course.async("text");
			JSON.parse(info).result.forEach((data: CourseInfo) => {
				const section: Section = {
					uuid: `${data.id}`,
					id: id,
					title: data.Title,
					instructor: data.Professor,
					dept: data.Subject,
					year: data.Section === "overall" ? 1900 : parseInt(data.Year),
					avg: data.Avg,
					pass: data.Pass,
					fail: data.Fail,
					audit: data.Audit,
				};
				let check: Boolean = true;
				for (const data in section) {
					if (!data) {
						check = false;
					}
				}
				if (check) {
					sections.push(section);
				}
			});
		}
		console.log(sections);

		throw new Error(
			`InsightFacadeImpl::addDataset() is unimplemented! - id=${id}; content=${content?.length}; kind=${kind}`
		);
	}

	public async removeDataset(id: string): Promise<string> {
		// TODO: Remove this once you implement the methods!
		throw new Error(`InsightFacadeImpl::removeDataset() is unimplemented! - id=${id};`);
	}

	public async performQuery(query: unknown): Promise<InsightResult[]> {
		// TODO: Remove this once you implement the methods!
		throw new Error(`InsightFacadeImpl::performQuery() is unimplemented! - query=${query};`);
	}

	public async listDatasets(): Promise<InsightDataset[]> {
		// TODO: Remove this once you implement the methods!
		throw new Error(`InsightFacadeImpl::listDatasets is unimplemented!`);
	}
}
