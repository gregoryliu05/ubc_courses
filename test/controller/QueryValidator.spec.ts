import { expect, use } from "chai";
import chaiAsPromised from "chai-as-promised";
import { QueryManager } from "../../src/controller/QueryManager";
import { Query } from "../../src/controller/insightTypes";
import {getFilterValidator, validateFilter} from "../../src/controller/QueryValidator";
import {loadTestQuery} from "../TestUtil";

use(chaiAsPromised);

describe("QueryValidator", function () {
	before(async function () {});

	describe("validateQuery", function () {
		let queryManager: QueryManager;

		before(async function () {});

		beforeEach(async function () {});

		it.only("should successfully parse a query", async function () {
			const testQuery = await loadTestQuery("[valid/complex.json]");

			queryManager = new QueryManager(testQuery.input);
			const queryObj: Query = queryManager.getQuery();
			validateFilter(queryObj.WHERE)
			return expect(JSON.stringify(queryObj)).to.deep.equal(JSON.stringify(testQuery.input));
		});

		it("test get function", function() {
			console.log(getFilterValidator("aosidjf"));
		});
	});
});
