import {
	IInsightFacade,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
	ResultTooLargeError,
} from "../../src/controller/IInsightFacade";
import InsightFacade from "../../src/controller/InsightFacade";
import { clearDisk, getContentFromArchives, loadTestQuery } from "../TestUtil";

import { expect, use } from "chai";
import chaiAsPromised from "chai-as-promised";

use(chaiAsPromised);

export interface ITestQuery {
	title?: string;
	input: unknown;
	errorExpected: boolean;
	expected: any;
}

const errorMap: Record<string, Function> = {
	InsightError,
	NotFoundError,
	ResultTooLargeError,
};

describe("InsightFacade", function () {
	let facade: IInsightFacade;

	before(async function () {
		// Just in case there is anything hanging around from a previous run of the test suite
		await clearDisk();
	});

	describe("AddDataset", function () {
		let cpsc310: string;
		let noCourses: string;
		let noSections: string;
		let invalidSection: string;
		let validSections: string;
		let invalidFolderStructure: string;
		let invalidJSON: string;
		let campus: string;
		let noindex: string;
		let emptyIndex: string;
		let noBuildings: string;
		let noRooms: string;
		let someRooms: string;
		let someValidRooms: string;

		before(async function () {
			cpsc310 = await getContentFromArchives("cpsc310.zip");
			noCourses = await getContentFromArchives("empty.zip");
			noSections = await getContentFromArchives("noSections.zip");
			invalidSection = await getContentFromArchives("invalidSection.zip");
			validSections = await getContentFromArchives("validSections.zip");
			invalidFolderStructure = await getContentFromArchives("invalidFolderStructure.zip");
			invalidJSON = await getContentFromArchives("invalidJSON.zip");
			campus = await getContentFromArchives("campus.zip");
			noindex = await getContentFromArchives("campusnoindex.zip");
			emptyIndex = await getContentFromArchives("campusemptyindex.zip");
			noBuildings = await getContentFromArchives("campusnobuildings.zip");
			noRooms = await getContentFromArchives("campusnovalidroomsorbuildings.zip");
			someRooms = await getContentFromArchives("campussomevalidrooms.zip");
			someValidRooms = await getContentFromArchives("campussomevalid.zip");
		});

		beforeEach(async function () {
			await clearDisk();
			facade = new InsightFacade();
		});

		it("should reject with empty dataset", async function () {
			try {
				await facade.addDataset("a", noCourses, InsightDatasetKind.Sections);
				expect.fail("Should have thrown InsightError.");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject dataset with invalid JSON format", async function () {
			try {
				await facade.addDataset("a", invalidJSON, InsightDatasetKind.Sections);
				expect.fail("Should have thrown InsightError.");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject dataset with invalid folder structure", async function () {
			try {
				await facade.addDataset("a", invalidFolderStructure, InsightDatasetKind.Sections);
				expect.fail("Should have thrown InsightError.");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should successfully add a dataset", async function () {
			const result = await facade.addDataset("ubc", cpsc310, InsightDatasetKind.Sections);
			expect(result).to.have.members(["ubc"]);
		});

		it("should successfully add multiple datasets", async function () {
			await facade.addDataset("a", cpsc310, InsightDatasetKind.Sections);
			await facade.addDataset("b", cpsc310, InsightDatasetKind.Sections);
			const result = await facade.addDataset("c", cpsc310, InsightDatasetKind.Sections);
			return expect(result).to.have.members(["a", "b", "c"]);
		});

		it("should reject with an empty dataset id", async function () {
			try {
				await facade.addDataset("", cpsc310, InsightDatasetKind.Sections);
				expect.fail("Should have thrown InsightError.");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject with whitespace only dataset id", async function () {
			try {
				await facade.addDataset("   ", cpsc310, InsightDatasetKind.Sections);
				expect.fail("Should have thrown InsightError.");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject with underscore contained in dataset id", async function () {
			try {
				await facade.addDataset("a_b", cpsc310, InsightDatasetKind.Sections);
				expect.fail("Should have thrown InsightError.");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject with duplicated dataset id", async function () {
			await facade.addDataset("a", cpsc310, InsightDatasetKind.Sections);
			try {
				await facade.addDataset("a", cpsc310, InsightDatasetKind.Sections);
				expect.fail("Should have thrown InsightError.");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject with invalid content string", async function () {
			try {
				await facade.addDataset("a", "abcd", InsightDatasetKind.Sections);
				expect.fail("Should have thrown InsightError.");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject dataset with course but no sections", async function () {
			try {
				await facade.addDataset("a", noSections, InsightDatasetKind.Sections);
				expect.fail("Should have thrown InsightError.");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject dataset with no valid sections", async function () {
			try {
				await facade.addDataset("a", invalidSection, InsightDatasetKind.Sections);
				expect.fail("Should have thrown InsightError.");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should successfully add a dataset with invalid sections and valid sections", async function () {
			const result = await facade.addDataset("a ", validSections, InsightDatasetKind.Sections);
			expect(result).to.have.members(["a"]);
		});

		it("should reject dataset with invalid kind", async function () {
			try {
				await facade.addDataset("a", cpsc310, "abcd" as InsightDatasetKind);
				expect.fail("Should have thrown InsightError.");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should add valid rooms dataset", async function () {
			try {
				const result = await facade.addDataset("lol", campus, InsightDatasetKind.Rooms);
				expect(result).to.have.members(["lol"]);
			} catch {}
		});

		it("good should reject invalid rooms dataset", async function () {
			try {
				await facade.addDataset("fail", cpsc310, InsightDatasetKind.Rooms);
				expect.fail("should have thrown InsightError");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("good should reject no index file", async function () {
			try {
				await facade.addDataset("noindex", noindex, InsightDatasetKind.Rooms);
				expect.fail("should have thrown InsightError");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});
		// index file no table
		it("good should reject index file no table", async function () {
			try {
				await facade.addDataset("invalidindex", emptyIndex, InsightDatasetKind.Rooms);
				expect.fail("should have thrown InsightError");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});
		// index file with table, but index file is missing some buildings???
		// then make a test with where index file is missing the buildings

		// No folder of buildings and rooms
		it("good should reject, no buildings folder", async function () {
			try {
				await facade.addDataset("nobuildings", noBuildings, InsightDatasetKind.Rooms);
				expect.fail("should have thrown InsightError");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});
		// No valid buildings
		// in this case, there are 2 building files, one doesn't have a table at all,
		// one has a table but has no valid rooms in it.
		it("good should reject, no valid rooms in the building files", async function () {
			try {
				await facade.addDataset("norooms", noRooms, InsightDatasetKind.Rooms);
				expect.fail("should have thrown InsightError");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should add a bunch of datasets", async function () {
			try {
				await facade.addDataset("rooms", campus, InsightDatasetKind.Rooms);
				await facade.addDataset("sections", validSections, InsightDatasetKind.Sections);
				const res = await facade.addDataset("someRooms", someRooms, InsightDatasetKind.Rooms);
				expect(res).to.have.members(["rooms", "sections", "someRooms"]);
			} catch {
				expect.fail("should not throw error");
			}
		});

		it("should add a dataset", async function () {
			try {
				const res = await facade.addDataset("someRooms", someValidRooms, InsightDatasetKind.Rooms);
				expect(res).to.have.members(["someRooms"]);
			} catch {
				expect.fail("should not throw error");
			}
		});
	});

	describe("RemoveDataset", function () {
		let cpsc310: string;

		before(async function () {
			cpsc310 = await getContentFromArchives("cpsc310.zip");
		});

		beforeEach(async function () {
			await clearDisk();
			facade = new InsightFacade();
		});

		it("should remove single dataset", async function () {
			await facade.addDataset("a", cpsc310, InsightDatasetKind.Sections);
			const result = await facade.removeDataset("a");
			return expect(result).to.be.eq("a");
		});

		it("should remove multiple datasets", async function () {
			await facade.addDataset("a", cpsc310, InsightDatasetKind.Sections);
			await facade.addDataset("b", cpsc310, InsightDatasetKind.Sections);
			await facade.removeDataset("a");
			const result = await facade.removeDataset("b");
			return expect(result).to.be.eq("b");
		});

		it("should remove correct dataset", async function () {
			await facade.addDataset("a", cpsc310, InsightDatasetKind.Sections);
			await facade.addDataset("b", cpsc310, InsightDatasetKind.Sections);
			const result = await facade.removeDataset("a");
			return expect(result).to.be.eq("a");
		});

		it("should reject remove dataset not present", async function () {
			try {
				await facade.addDataset("a", cpsc310, InsightDatasetKind.Sections);
				await facade.removeDataset("b");
				expect.fail("Should have thrown NotFoundError.");
			} catch (err) {
				expect(err).to.be.instanceOf(NotFoundError);
			}
		});

		it("should reject remove dataset twice", async function () {
			try {
				await facade.addDataset("a", cpsc310, InsightDatasetKind.Sections);
				await facade.removeDataset("a");
				await facade.removeDataset("a");
				expect.fail("Should have thrown NotFoundError.");
			} catch (err) {
				expect(err).to.be.instanceOf(NotFoundError);
			}
		});

		it("should reject remove empty id dataset", async function () {
			try {
				await facade.removeDataset("");
				expect.fail("Should have thrown InsightError.");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject remove space only id dataset", async function () {
			try {
				await facade.removeDataset("  ");
				expect.fail("Should have thrown InsightError.");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject remove underscore id dataset", async function () {
			try {
				await facade.removeDataset("a_b");
				expect.fail("Should have thrown InsightError.");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});
	});

	describe("ListDataset", function () {
		let cpsc310: string;
		let campus: string;
		let someRooms: string;

		before(async function () {
			cpsc310 = await getContentFromArchives("cpsc310.zip");
			campus = await getContentFromArchives("campus.zip");
			someRooms = await getContentFromArchives("campussomevalidrooms.zip");
		});

		beforeEach(async function () {
			await clearDisk();
			facade = new InsightFacade();
		});

		it("should return empty dataset arr", async function () {
			const result = await facade.listDatasets();
			return expect(result).to.deep.eq([]);
		});

		it("should successfully return multiple datasets", async function () {
			await facade.addDataset("a", cpsc310, InsightDatasetKind.Sections);
			await facade.addDataset("b", cpsc310, InsightDatasetKind.Sections);
			const result = await facade.listDatasets();
			return expect(result).to.have.deep.members([
				{ id: "a", kind: InsightDatasetKind.Sections, numRows: 39 },
				{ id: "b", kind: InsightDatasetKind.Sections, numRows: 39 },
			]);
		});

		it("should successfully return a lot of datasets", async function () {
			await facade.addDataset("rooms", campus, InsightDatasetKind.Rooms);
			await facade.addDataset("moreRooms", someRooms, InsightDatasetKind.Rooms);
			await facade.addDataset("cpsc310", cpsc310, InsightDatasetKind.Sections);
			const result = await facade.listDatasets();
			return expect(result).to.have.deep.members([
				{ id: "rooms", kind: InsightDatasetKind.Rooms, numRows: 364 },
				{ id: "moreRooms", kind: InsightDatasetKind.Rooms, numRows: 28 },
				{ id: "cpsc310", kind: InsightDatasetKind.Sections, numRows: 39 },
			]);
		});
	});

	describe("PerformQuery", function () {
		/**
		 * Loads the TestQuery specified in the test name and asserts the behaviour of performQuery.
		 *
		 * Note: the 'this' parameter is automatically set by Mocha and contains information about the test.
		 */
		let sections: string;
		let sections5000: string;
		let sections5001: string;
		let campus: string;
		async function checkQuery(this: Mocha.Context): Promise<void> {
			if (!this.test) {
				throw new Error(
					"Invalid call to checkQuery." +
						"Usage: 'checkQuery' must be passed as the second parameter of Mocha's it(..) function." +
						"Do not invoke the function directly."
				);
			}
			// Destructuring assignment to reduce property accesses
			const { input, expected, errorExpected } = await loadTestQuery(this.test.title);
			let result: InsightResult[] = []; // dummy value before being reassigned
			try {
				result = await facade.performQuery(input);
			} catch (err) {
				if (!errorExpected) {
					expect.fail(`performQuery threw unexpected error: ${err}`);
				}
				expect(err).to.be.instanceOf(errorMap[expected as keyof typeof errorMap]);
				return;
			}
			if (errorExpected) {
				expect.fail(`performQuery resolved when it should have rejected with ${expected}`);
			}
			expect(result).to.deep.members(expected);
		}

		async function checkQueryOrdered(this: Mocha.Context): Promise<void> {
			if (!this.test) {
				throw new Error(
					"Invalid call to checkQuery." +
						"Usage: 'checkQuery' must be passed as the second parameter of Mocha's it(..) function." +
						"Do not invoke the function directly."
				);
			}
			// Destructuring assignment to reduce property accesses
			const { input, expected, errorExpected } = await loadTestQuery(this.test.title);
			let result: InsightResult[] = []; // dummy value before being reassigned
			try {
				result = await facade.performQuery(input);
			} catch (err) {
				if (!errorExpected) {
					expect.fail(`performQuery threw unexpected error: ${err}`);
				}
				expect(err).to.be.instanceOf(errorMap[expected as keyof typeof errorMap]);
				return;
			}
			if (errorExpected) {
				expect.fail(`performQuery resolved when it should have rejected with ${expected}`);
			}
			expect(result).to.deep.equal(expected);
		}

		before(async function () {
			await clearDisk();

			facade = new InsightFacade();
			sections = await getContentFromArchives("pair.zip");
			sections5000 = await getContentFromArchives("5000.zip");
			sections5001 = await getContentFromArchives("5001.zip");
			campus = await getContentFromArchives("campus.zip");
			// Add the datasets to InsightFacade once.
			// Will *fail* if there is a problem reading ANY dataset.
			try {
				await facade.addDataset("sections", sections, InsightDatasetKind.Sections);
				await facade.addDataset("sections-5001", sections5001, InsightDatasetKind.Sections);
				await facade.addDataset("sections-5000", sections5000, InsightDatasetKind.Sections);
				await facade.addDataset("rooms", campus, InsightDatasetKind.Rooms);
			} catch (err) {
				throw new Error(`In PerformQuery Before hook, dataset(s) failed to be added. \n${err}`);
			}
		});

		after(async function () {
			await clearDisk();
		});

		// Examples demonstrating how to test performQuery using the JSON Test Queries.
		// The relative path to the query file must be given in square brackets.
		it("[valid/simple.json] SELECT dept, avg WHERE avg > 97", checkQuery);
		it("[valid/5000.json] SELECT 5000 rows", checkQuery);
		it("[valid/complex.json] Complex query", checkQuery);
		it("[valid/containsWildcard.json] Contains wildcard", checkQuery);
		it("[valid/exactMatchWildcard.json] Exact match wildcard", checkQuery);
		it("[valid/leftWildcard.json] Left wildcard", checkQuery);
		it("[valid/ordered.json] Ordered results", checkQueryOrdered);
		it("[valid/orderedUP.json] Ordered results", checkQueryOrdered);
		it("[valid/orderedDOWN.json] Ordered results", checkQueryOrdered);
		it("[valid/orderedMultipleKeys.json] Ordered results", checkQueryOrdered);
		it("[valid/orderedRooms.json] Ordered results", checkQueryOrdered);
		it("[valid/orderedApplyKey.json] Ordered results", checkQueryOrdered);
		it("[valid/rightWildcard.json] Right wildcard", checkQuery);
		it("[valid/testTransformations.json] Testing transformations", checkQuery);
		it("[valid/testTransformationsNoApply.json] Testing transformations no apply", checkQuery);
		it("[valid/testTransformationsCount.json] Testing count transformations", checkQuery);

		it("[invalid/missingWhere.json] Query missing WHERE", checkQuery);
		it("[invalid/over5000.json] SELECT over 5000", checkQuery);
		it("[invalid/5001Results.json] SELECT 5001 results", checkQuery);
		it("[invalid/invalidObject.json] Invalid object", checkQuery);
		it("[invalid/middleWildcard.json] Middle wildcard", checkQuery);
		it("[invalid/missingColumns.json] Query missing COLUMNS", checkQuery);
		it("[invalid/missingOptions.json] Query missing OPTIONS", checkQuery);
		it("[invalid/multipleDatasetsOptions.json] Multiple datasets in OPTIONS", checkQuery);
		it("[invalid/multipleDatasetsWhere.json] Multiple datasets in WHERE", checkQuery);
		it("[invalid/orderNotInColumn.json] Order key not in COLUMNS", checkQuery);
		it("[valid/allrooms.json] one maindataset ", checkQuery);
	});
});
