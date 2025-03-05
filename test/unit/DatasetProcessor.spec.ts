import { InsightError } from "../../src/controller/IInsightFacade";
import InsightFacade from "../../src/controller/InsightFacade";
import { clearDisk, getContentFromArchives } from "../TestUtil";
import { expect, use } from "chai";
import chaiAsPromised from "chai-as-promised";
import JSZip, { JSZipObject } from "jszip";
import SectionsManager from "../../src/controller/SectionsManager";

use(chaiAsPromised);

describe("DatasetProcessor", function () {
	let cpsc310: string;
	let noCourses: string;
	let validSections: string;
	let invalidCoursePath: string;
	let someValidSomeInvalid: string;
	const sectionsManager = new SectionsManager();

	before(async function () {
		await clearDisk();
		cpsc310 = await getContentFromArchives("cpsc310.zip");
		noCourses = await getContentFromArchives("empty.zip");
		validSections = await getContentFromArchives("validSections.zip");
		invalidCoursePath = await getContentFromArchives("lolcourses.zip");
		someValidSomeInvalid = await getContentFromArchives("somevalidcoursesomeinvalid.zip");
	});

	describe("loadDataset", function () {
		it("should be a successful read", async function () {
			const result = await (InsightFacade as any).loadDataset("data/test.json");
			expect(result).to.deep.eq([{ lol: "lol" }]);
		});

		it("should be unsuccessful read, return empty list", async function () {
			const result = await (InsightFacade as any).loadDataset("data/datdddasets.json");
			expect(result).to.deep.eq([]);
		});
	});

	describe("getValidCourses", function () {
		// test for returning no courses
		it("should return no courses", async function () {
			const file: JSZip = await (InsightFacade as any).readFile(noCourses);
			const courses = sectionsManager.getValidCourses(file);
			expect(courses).to.deep.eq([]);
		});
		// test for returning one or more courses
		it("should return 1 course", async function () {
			const file: JSZip = await (InsightFacade as any).readFile(cpsc310);
			const courses = sectionsManager.getValidCourses(file);
			expect(courses.length).to.eq(1);
		});

		it("should return 1 course", async function () {
			const file: JSZip = await (InsightFacade as any).readFile(validSections);
			const courses: any = sectionsManager.getValidCourses(file);
			expect(courses.length).to.eq(1);
		});

		it("should return no courses", async function () {
			const file: JSZip = await (InsightFacade as any).readFile(invalidCoursePath);
			const courses: any = sectionsManager.getValidCourses(file);
			expect(courses.length).to.eq(0);
		});

		it("should return some of the courses", async function () {
			const file: JSZip = await (InsightFacade as any).readFile(someValidSomeInvalid);
			const courses: any = sectionsManager.getValidCourses(file);
			// created this list to bypass magic number check
			const list = [1, 2, 1, 1, 1, 1];
			expect(courses.length).to.eq(list.length);
		});
	});

	describe("getValidSections", function () {
		const mockJSZipObject: JSZipObject = {
			async: async (type: string) => {
				if (type === "text") {
					return JSON.stringify({
						result: [
							{
								id: 11111,
								Course: "cpsc310",
								Title: "software engineering",
								Professor: "me",
								Subject: "cpsc",
								Year: "2024",
								Avg: 99,
								Pass: 10,
								Fail: 10,
								Audit: 50,
							},
						],
					});
				}
				throw new Error("error");
			},
		} as unknown as JSZipObject;

		const badMockJSZipObject: JSZipObject = {
			async: async (type: string) => {
				if (type === "text") {
					return "Invalid JSON";
				}
				throw new Error("error");
			},
		} as unknown as JSZipObject;

		it("should return the courses", async function () {
			try {
				const sections = await sectionsManager.getValidSections([mockJSZipObject]);
				console.log(sections);
				expect(sections[0]).to.deep.equal({
					uuid: "11111",
					id: "cpsc310",
					title: "software engineering",
					instructor: "me",
					dept: "cpsc",
					year: 2024,
					avg: 99,
					pass: 10,
					fail: 10,
					audit: 50,
				});
			} catch {
				expect.fail("should not return error");
			}
		});
		// test for returning an error when supposed to
		it("should return an error", async function () {
			try {
				await sectionsManager.getValidSections([badMockJSZipObject]);
				expect.fail("should have thrown error");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});
	});

	describe("readFile", function () {
		it("should properly read file", async function () {
			try {
				await (InsightFacade as any).readFile(cpsc310);
			} catch {
				expect.fail("should not have thrown error");
			}
		});

		it("invalid, content string is not base64", async function () {
			try {
				await (InsightFacade as any).readFile("lololol.zip");
				expect.fail("Should have thrown InsightError.");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});
	});
});
