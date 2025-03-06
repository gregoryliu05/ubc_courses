import JSZip, { JSZipObject } from "jszip";
import { CourseInfo, Section } from "./insightTypes";
import { InsightError } from "./IInsightFacade";

export default class SectionsManager {
	public getValidCourses(data: JSZip): JSZipObject[] {
		const courses: JSZipObject[] = [];
		// having only startsWith doesn't consider if a courses folder has another folder called courses
		// with courses that shouldn't be added, e.g. /courses/courses/CPSC310 -> shouldn't be added
		// i asked ta about this, he said this case should never happen or smth? so very confused
		Object.entries(data.files).forEach(([name, object]) => {
			const parts: String[] = name.split("/");
			if (
				parts.length === 2 &&
				parts[0] === "courses" &&
				parts[1] !== "" &&
				!name.includes("__MACOSX") &&
				!name.includes(".DS_Store")
			) {
				courses.push(object);
			}
		});
		return courses;
	}

	public async getValidSections(courses: JSZipObject[]): Promise<Section[]> {
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

	public async processSections(data: JSZip): Promise<Section[]> {
		const courses: JSZipObject[] = this.getValidCourses(data);

		if (courses.length === 0) {
			throw new InsightError("no valid courses");
		}

		const sections: Section[] = await this.getValidSections(courses);

		if (sections.length === 0) {
			throw new InsightError("no valid sections");
		}

		return sections;
	}
}
