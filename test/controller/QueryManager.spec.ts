import { expect, use } from "chai";
import chaiAsPromised from "chai-as-promised";
import { QueryManager } from "../../src/controller/QueryManager";
import { Query } from "../../src/controller/insightTypes";
import { InsightError } from "../../src/controller/IInsightFacade";
import { loadTestQuery } from "../TestUtil";

use(chaiAsPromised);

describe("QueryManager", function () {
	before(async function () {});

	describe("parseQuery", function () {
		let queryManager: QueryManager;

		before(async function () {});

		beforeEach(async function () {});

		it("should successfully parse a query", async function () {
			const testQuery = await loadTestQuery("[valid/complex.json]");
			queryManager = new QueryManager(testQuery);
			const queryObj: Query = queryManager.getQuery();
			return expect(JSON.stringify(queryObj)).to.deep.equal(JSON.stringify(testQuery));
		});

		it("should reject invalid JSON query", async function () {
			const query = "abc";
			queryManager = new QueryManager(query);
			try {
				await queryManager.performQuery();
				expect.fail("Should have thrown InsightError.");
			} catch (e) {
				expect(e).to.be.instanceOf(InsightError);
			}
		});
	});
});
