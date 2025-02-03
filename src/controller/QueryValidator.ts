import {
	Filter,
	LogicComparison,
	MComparison,
	MField,
	SField,
	MKey,
	Negation,
	Query,
	SComparison,
	Options, Key
} from "./insightTypes";
import {InsightError} from "./IInsightFacade";

export function validate(query: Query): boolean {

	// Valid JSON Object
	if (typeof query !== "object" || query === null || Array.isArray(query)) {
		throw new InsightError("Query must be a valid JSON object");
	}

	// Validate WHERE
	try {
		validateWhere(query.WHERE);
	} catch (e) {
		if (e instanceof InsightError) {throw e;}
		throw new InsightError("Could not validate the WHERE clause");
	}

	// Validate OPTIONS

	try {
		validateOptions(query.OPTIONS);
	} catch (e) {
		if (e instanceof InsightError) {throw e;}
		throw new InsightError("Could not validate the OPTIONS clause");
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


// WHERE VALIDATION
function validateWhere(where: any): void {
	if (typeof where !== "object" || where === null || Array.isArray(where)) {
		throw new InsightError("WHERE must be an object");
	}
	if (Object.keys(where).length === 0) {
		return;
	}
	validateFilter(where);
}

function validateID(id: string): void {
	// one or more of any character except underscore
	const pattern = new RegExp("[^_]+");
	if (!pattern.test(id)) {
		throw new InsightError(`Invalid idstring: ${id}`)
	}
}

function validateInputString(s: string): void {

	const pattern = new RegExp("^\\*?[^*]+\\*?$");

	if (!pattern.test(s)) {
		throw new InsightError(`Invalid inputstring: ${s}`);
	}

	if (str.length > 2) {
		if (str.substring(1, s.length - 1).includes("*")) {
			throw new InsightError(`Invalid wildcard placement in: ${s}`);
		}
	}
}

function validateLogicComparison(logic: LogicComparison): void {

	const filterArray = Object.values(logic)[0]

	if (!Array.isArray(filterArray)) {
		throw new InsightError("Provided filters for logic comparison is not in an array")
	}

	for (const filter of filterArray) {
		validateFilter(filter);
	}
}

function validateMComparison(mcomparison: MComparison): void {
	const keys = Object.keys(mcomparison);

	if (keys.length !== 1) {
		throw new InsightError("MComparison must contain single comparison");
	}

	const body = Object.values(mcomparison)[0];
	if (typeof body !== "object") {
		throw new InsightError("MComparison body is not a valid object");
	}
	if (Object.keys(body).length !== 1) {
		throw new InsightError("MComparison body must contain single value");
	}

	const mkey = Object.keys(body)[0];
	const value = Object.values(body)[0];
	if (typeof value !== "number") {
		throw new InsightError("MComparison value must be a number");
	}
	validateMKey(mkey);
}

function validateMKey(mkey: MKey): void {
	const parts = mkey.split("_");
	if (parts.length !== 2) {
		throw new InsightError("MKey is not in the correct format");
	}
	validateID(parts[0]);
	if(!MField.includes(parts[1] as string)) {
		throw new InsightError(`${parts[1]} is not a valid mfield type`);
	}
}

function validateSComparison(scomparison: SComparison): void {
	const keys = Object.keys(scomparison);

	if (keys.length !== 1) {
		throw new InsightError("SComparison must contain single comparison");
	}

	const values = Object.values(scomparison);
	if (values.length !== 1) {
		throw new InsightError("SComparison must only contain a single string value to compare");
	}

	const skey = Object.keys(value)[0];
	validateSKey(skey);

	const value = values[0];
	validateInputString(value);

}

function validateSKey(skey: SKey, value: any): void {
	const parts = skey.split("_");
	if (parts.length !== 2) {
		throw new InsightError("SKey is not in the correct format");
	}
	validateID(parts[0]);
	if(!SField.includes(parts[1] as string)) {
		throw new InsightError(`${parts[1]} is not a valid sfield type`);
	}
}

function validateNegation(negation: Negation): void {
	return validateFILTER(negation.NOT);
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
	if (typeof filter !== "object" || filter === null || Array.isArray(filter)) {
		throw new InsightError(`Filter must be an object`);
	}
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




// OPTIONS VALIDATION

export function validateOptions(options: Options): void {
	if (typeof options !== "object" || options === null || Array.isArray(options)) {
		throw new InsightError("OPTIONS must be an object");
	}

	validateColumns(options.COLUMNS);
	if(options.ORDER) {
		validateOrder(options.ORDER, options.COLUMNS);
	}

}

function validateColumns(columns: Key[]):void {
	if (!columns || !Array.isArray(columns) || columns.length === 0) {
		throw new InsightError("COLUMNS must be a non-empty array");
	}

	for (const key of columns) {
		const parts = key.split("_");
		if (parts.length !== 2) {
			throw new InsightError("Column key is not in the correct format");
		}
		validateID(parts[0]);
		if(!SField.includes(parts[1] as string) && !MField.includes(parts[1] as string)) {
			throw new InsightError(`${parts[1]} is not a valid sfield or mfield type`);
		}
	}
}

function validateOrder(order: Key, columns: Key[]):void {
	if (!columns.includes(options.ORDER)) {
		throw new InsightError("Order key must be in COLUMNS key list");
	}
}
