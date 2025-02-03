import {Filter, LogicComparison, MComparison, Negation, Query, SComparison} from "./insightTypes";
import {InsightError} from "./IInsightFacade";

export function validate(query: Query): boolean {

	// Valid JSON Object
	if (typeof query !== "object" || query === null || Array.isArray(query)) {
		throw new InsightError("Query must be a valid JSON object");
	}

	try {
		validateWhere(query.WHERE);
	} catch (e) {
		if (e instanceof InsightError) {throw e;}
		throw new InsightError("Could not validate the WHERE clause");
	}

	// Has WHERE clause

	// Has COLUMNS clause

	// Single DATASET referenced in WHERE

	// Single DATASET referenced in COLUMNS

	// Wildcard valid

	// Order key is in COLUMNS key list

	// Dataset exists

	// Number of results <= 5000


	return true;
}

function validateWhere(where: any): void {
	if (typeof where !== "object" || where === null || Array.isArray(where)) {
		throw new InsightError("WHERE must be an object");
	}
	if (Object.keys(where).length === 0) {
		return;
	}
	validateFilter(where);
}

function validateLogicComparison(logic: LogicComparison): void {
	if (typeof logic !== "object" || logic === null || Array.isArray(logic)) {
		throw new InsightError("LogicComparison must be an object");
	}

	const filterArray = Object.values(logic)[0]

	if (!Array.isArray(filterArray)) {
		throw new InsightError("Provided filters for logic comparison is not in an array")
	}

	for (const filter of filterArray) {
		validateFilter(filter);
	}
}

function validateMComparison(mcomparison: MComparison): void {

}

function validateSComparison(scomparison: SComparison): void {

}

function validateNegation(negation: Negation): void {

}

const filterValidators: Record<string, (f: any) => void> = {
	"AND": validateLogicComparison,
	"OR": validateLogicComparison,
	"LT": validateMComparison,
	"GT": validateMComparison,
	"EQ": validateMComparison,
	"IS": validateSComparison,
	"NOT": validateNegation
};

export function getFilterValidator(filter: string): ((f: any) => void) | null {
	return filterValidators[filter] || null;
}
export function validateFilter(filter: Filter): void {

	const filters = Object.keys(filter);
	if (filters.length>1) {
		throw new InsightError("More than 1 filter given");
	}
	if (filters.length<1) {
		throw new InsightError("No filters given");
	}
	const validator= getFilterValidator(filters[0]);
	if (validator) {
		validator(filter);
	} else {
		throw new InsightError("Invalid filter type");
	}
}
