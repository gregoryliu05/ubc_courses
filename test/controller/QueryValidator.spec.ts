import { expect, use } from "chai";
import chaiAsPromised from "chai-as-promised";
import { Query } from "../../src/controller/insightTypes";
import { validate } from "../../src/controller/QueryValidator";
import { loadTestQuery } from "../TestUtil";
import { InsightError } from "../../src/controller/IInsightFacade";

use(chaiAsPromised);

describe("QueryValidator", function () {
	let ids: string[] = [];

	before(async function () {});

	describe("test validate", function () {
		before(async function () {});

		beforeEach(function () {
			ids = [];
		});

		it("should reject invalid query object", async function () {
			const testQuery = await loadTestQuery("[invalid/invalidObject.json]");
			try {
				validate(testQuery.input as Query, ids);
				expect.fail("Should have thrown InsightError.");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
				expect(err).to.have.property("message", "Query must be a valid JSON object");
			}
		});

		it("should reject multiple datasets in options", async function () {
			const testQuery = await loadTestQuery("[invalid/multipleDatasetsOptions.json]");
			try {
				validate(testQuery.input as Query, ids);
				expect.fail("Should have thrown InsightError.");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
				expect(err).to.have.property("message", "Only 1 dataset can be referenced in the query");
			}
		});

		it("should reject multiple datasets in where", async function () {
			const testQuery = await loadTestQuery("[invalid/multipleDatasetsWhere.json]");
			try {
				validate(testQuery.input as Query, ids);
				expect.fail("Should have thrown InsightError.");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
				expect(err).to.have.property("message", "Only 1 dataset can be referenced in the query");
			}
		});
	});

	describe("test validateWhere", function () {
		before(async function () {});

		beforeEach(function () {
			ids = [];
		});

		it("should reject missing where", async function () {
			const testQuery = await loadTestQuery("[invalid/missingWhere.json]");
			try {
				validate(testQuery.input as Query, ids);
				expect.fail("Should have thrown InsightError.");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
				expect(err).to.have.property("message", "WHERE must be an object");
			}
		});
	});

	describe("test validateInputString", function () {
		before(async function () {});

		beforeEach(function () {
			ids = [];
		});

		it("should reject middle wildcard", async function () {
			const testQuery = await loadTestQuery("[invalid/middleWildcard.json]");
			try {
				validate(testQuery.input as Query, ids);
				expect.fail("Should have thrown InsightError.");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
				expect(err).to.have.property("message", "Invalid inputstring: C*c");
			}
		});

		it("should accept wildcard only input string", async function () {
			const testQuery = await loadTestQuery("[valid/wildcardOnly.json]");
			try {
				validate(testQuery.input as Query, ids);
			} catch {
				expect.fail("Should not have thrown error");
			}
		});
	});

	describe("test validateOptions", function () {
		before(async function () {});

		beforeEach(function () {
			ids = [];
		});

		it("should reject missing OPTIONS", async function () {
			const testQuery = await loadTestQuery("[invalid/missingOptions.json]");
			try {
				validate(testQuery.input as Query, ids);
				expect.fail("Should have thrown InsightError.");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
				expect(err).to.have.property("message", "OPTIONS must be an object");
			}
		});
	});

	describe("test validateColumns", function () {
		before(async function () {});

		beforeEach(function () {
			ids = [];
		});

		it("should reject missing COLUMNS", async function () {
			const testQuery = await loadTestQuery("[invalid/missingColumns.json]");
			try {
				validate(testQuery.input as Query, ids);
				expect.fail("Should have thrown InsightError.");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
				expect(err).to.have.property("message", "COLUMNS must be a non-empty array");
			}
		});
	});
});
