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
								id: 11111,
								Title: "software engineering",
								Course: "310",
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
				const sections = await (InsightFacade as any).getValidSections([mockJSZipObject], "cpsc310");
				expect(sections[0]).to.deep.equal({
					uuid: "11111",
					id: "310",
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
