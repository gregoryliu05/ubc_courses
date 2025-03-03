import JSZip, { JSZipObject } from "jszip";
import { CourseInfo, Section } from "./insightTypes";
import { InsightError } from "./IInsightFacade";

export default class SectionsManager {
	public getValidCourses(data: JSZip): JSZipObject[] {
		const minLength = 8;
		const courses: JSZipObject[] = [];
		Object.entries(data.files).forEach(([name, object]) => {
			if (name.includes("courses/") && !name.includes("__MACOSX") && name.length > minLength) {
				courses.push(object);
			}
		});
		return courses;
	}

	public async getValidSections(courses: JSZipObject[], id: string): Promise<Section[]> {
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
						id: courseInfo.Course,
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
				throw new InsightError(err instanceof Error ? err.message + " error" : "error");
			}
		}
		return sections;
	}

	public async processSections(data: JSZip, id: string): Promise<Section[]> {
		const courses: JSZipObject[] = this.getValidCourses(data);

		if (courses.length === 0) {
			throw new InsightError("no valid courses");
		}

		const sections: Section[] = await this.getValidSections(courses, id);

		if (sections.length === 0) {
			throw new InsightError("no valid sections");
		}

		return sections;
	}
}
