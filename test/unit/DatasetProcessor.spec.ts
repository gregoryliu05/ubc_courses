import {
	IInsightFacade,
	InsightError,

} from "../../src/controller/IInsightFacade";
import InsightFacade from "../../src/controller/InsightFacade";
import { clearDisk, getContentFromArchives, loadTestQuery } from "../TestUtil";


describe("DatasetProcessor", function (){
	let facade: IInsightFacade;

	before(async function () {

		await clearDisk();
	});



	describe("loadDataset", function () {
		// test for successful read from json file
		// test for unsuccessful read from json file, return an empty list


	})


	describe("getValidCourses", function () {
		// test for returning no courses
		// test for returning one or more courses
		// assert nothing with name other than starting with /courses


	})

	describe("getValidSections", function () {
		// test for properly returning the valid sections
		// test for returning an error when supposed to
	})

	describe("readFile", function () {
		// test for properly reading file
		// test for properly returning an error
	})

})
