import { expect, use } from "chai";
import chaiAsPromised from "chai-as-promised";
import { QueryManager } from "../../src/controller/QueryManager";
import { Query } from "../../src/controller/insightTypes";
import {getFilterValidator, validate, validateFilter} from "../../src/controller/QueryValidator";
import {loadTestQuery} from "../TestUtil";
import {InsightError} from "../../src/controller/IInsightFacade";

use(chaiAsPromised);

describe("QueryValidator", function () {
	before(async function () {});

	describe("validateQuery", function () {
		let queryManager: QueryManager;

		before(async function () {});

		beforeEach(async function () {});

		it("should successfully parse a query", async function () {
			const testQuery = await loadTestQuery("[valid/complex.json]");
			queryManager = new QueryManager(testQuery.input);
			const queryObj: Query = queryManager.getQuery();
			return expect(JSON.stringify(queryObj)).to.deep.equal(JSON.stringify(testQuery.input));
		});

		it.only("should successfully parse a query", async function () {
			const testQuery = await loadTestQuery("[invalid/testQuery.json]");
			try {
				validate(testQuery.input as Query)
				expect.fail("Should have thrown InsightError.");
			} catch (err) {
				console.log(err)
				expect(err).to.be.instanceOf(InsightError);
			}		});

		it("test getValidator function", function() {
			console.log(getFilterValidator("aosidjf"));
		});
	});
});
