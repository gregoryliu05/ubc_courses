import { InsightError } from "../../src/controller/IInsightFacade";
import InsightFacade from "../../src/controller/InsightFacade";
import { clearDisk, getContentFromArchives } from "../TestUtil";
import { expect, use } from "chai";
import chaiAsPromised from "chai-as-promised";
import JSZip, { JSZipObject } from "jszip";

use(chaiAsPromised);

describe("DatasetProcessor", function () {
	let cpsc310: string;
	let noCourses: string;

	before(async function () {
		await clearDisk();
		cpsc310 = await getContentFromArchives("cpsc310.zip");
		noCourses = await getContentFromArchives("empty.zip");
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
			const courses = (InsightFacade as any).getValidCourses(file);
			expect(courses).to.deep.eq([]);
		});
		// test for returning one or more courses
		it("should return no courses", async function () {
			const file: JSZip = await (InsightFacade as any).readFile(cpsc310);
			const courses = (InsightFacade as any).getValidCourses(file);
			expect(courses.length).to.eq(1);
		});
	});

	describe("getValidSections", function () {
		const mockJSZipObject: JSZipObject = {
			async: async (type: string) => {
				if (type === "text") {
					return JSON.stringify({
						result: [
							{
								id: 12345,
								Title: "Software Engineering",
								Professor: "John Doe",
								Subject: "CPSC",
								Section: "101",
								Year: "2022",
								Avg: 80,
								Pass: 150,
								Fail: 10,
								Audit: 5,
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
				const sections = await (InsightFacade as any).getValidSections([mockJSZipObject], "cpsc310");
				expect(sections[0]).to.deep.equal({
					uuid: "12345",
					id: "cpsc310",
					title: "Software Engineering",
					instructor: "John Doe",
					dept: "CPSC",
					year: 2022,
					avg: 80,
					pass: 150,
					fail: 10,
					audit: 5,
				});
			} catch {
				expect.fail("should not return error");
			}
		});
		// test for returning an error when supposed to
		it("should return an error", async function () {
			try {
				await (InsightFacade as any).getValidSections([badMockJSZipObject], "object");
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
