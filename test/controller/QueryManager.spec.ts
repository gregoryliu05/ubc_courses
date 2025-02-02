import { expect, use } from "chai";
import chaiAsPromised from "chai-as-promised";
import { QueryManager } from "../../src/controller/QueryManager";
import { Query } from "../../src/controller/insightTypes";

use(chaiAsPromised);

describe("QueryManager", function () {
	before(async function () {});

	describe("parseQuery", function () {
		let queryManager: QueryManager;

		before(async function () {});

		beforeEach(async function () {});

		it("should successfully parse a query", async function () {
			const query = {
				WHERE: {
					AND: [
						{
							IS: {
								sections_id: "119",
							},
						},
						{
							NOT: {
								IS: {
									sections_dept: "phy*",
								},
							},
						},
						{
							OR: [
								{
									LT: {
										sections_year: 1901,
									},
								},
								{
									EQ: {
										sections_year: 2011,
									},
								},
								{
									GT: {
										sections_year: 2013,
									},
								},
							],
						},
					],
				},
				OPTIONS: {
					COLUMNS: [
						"sections_uuid",
						"sections_id",
						"sections_title",
						"sections_instructor",
						"sections_dept",
						"sections_year",
						"sections_avg",
						"sections_pass",
						"sections_fail",
						"sections_audit",
					],
					ORDER: "sections_year",
				},
			};
			queryManager = new QueryManager(query);
			const queryObj: Query = queryManager.getQuery();
			return expect(queryObj.OPTIONS.COLUMNS).to.have.members([
				"sections_uuid",
				"sections_id",
				"sections_title",
				"sections_instructor",
				"sections_dept",
				"sections_year",
				"sections_avg",
				"sections_pass",
				"sections_fail",
				"sections_audit",
			]);
		});
	});
});
