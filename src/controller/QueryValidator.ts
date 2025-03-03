import {
	Filter,
	LogicComparison,
	MComparison,
	MKey,
	Negation,
	Query,
	SComparison,
	Options,
	Key,
	SKey, ApplyRule,
} from "./insightTypes";
import { InsightError } from "./IInsightFacade";

export function validate(query: Query, ids: string[]): void {
	// Valid JSON Object
	if (typeof query !== "object" || query === null || Array.isArray(query)) {
		throw new InsightError("Query must be a valid JSON object");
	}
	// Validate WHERE
	try {
		validateWhere(query.WHERE, ids);
		validateOptions(query.OPTIONS);
		if(query.TRANSFORMATIONS)  {
			validateTransformations(query.TRANSFORMATIONS, ids)

		}
	}
	catch (e) {
		if (e instanceof InsightError) {
			throw e;
		}
		throw new InsightError("Could not validate the Query");
	}

	if (ids.length < 1) {
		throw new InsightError("No datasets referenced in given query");
	}
	if (new Set(ids).size > 1) {
		throw new InsightError("Only 1 dataset can be referenced in the query");
	}
}

// WHERE VALIDATION
function validateWhere(where: any, ids: string[]): void {
	if (typeof where !== "object" || where === null || Array.isArray(where)) {
		throw new InsightError("WHERE must be an object");
	}
	if (Object.keys(where).length === 0) {
		return;
	}
	validateFilter(where, ids);
}

function validateID(id: string, ids: string[]): void {
	// one or more of any character except underscore
	const pattern = new RegExp("[^_]+");
	if (!pattern.test(id)) {
		throw new InsightError(`Invalid idstring: ${id}`);
	}
	ids.push(id);
}

function validateInputString(s: string): void {
	const pattern = new RegExp("^\\*?[^*]*\\*?$");
	if (!pattern.test(s)) {
		throw new InsightError(`Invalid inputstring: ${s}`);
	}
}

function validateLogicComparison(logic: LogicComparison, ids: string[]): void {
	const filterArray = Object.values(logic)[0];

	if (!Array.isArray(filterArray)) {
		throw new InsightError("Provided filters for logic comparison is not in an array");
	}

	for (const filter of filterArray) {
		validateFilter(filter, ids);
	}
}

function validateMComparison(mcomparison: MComparison, ids: string[]): void {
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
	validateMKey(mkey as MKey, ids);
}

function validateMKey(mkey: MKey, ids: string[]): void {
	const parts = mkey.split("_");
	if (parts.length !== 2) {
		throw new InsightError("MKey is not in the correct format");
	}
	validateID(parts[0], ids);
	const validMFields: string[] = ["avg", "pass", "fail", "audit", "year", "lat", "lon", "seats"];
	if (!validMFields.includes(parts[1] as string)) {
		throw new InsightError(`${parts[1]} is not a valid mfield type`);
	}
}

function validateSComparison(scomparison: SComparison, ids: string[]): void {
	const keys = Object.keys(scomparison);

	if (keys.length !== 1) {
		throw new InsightError("SComparison must contain single comparison");
	}

	const values = Object.values(scomparison);
	if (values.length !== 1) {
		throw new InsightError("SComparison must only contain a single string value to compare");
	}

	const skey = Object.keys(values[0])[0];
	validateSKey(skey as SKey, ids);

	const value = Object.values(values[0])[0];
	validateInputString(value as string);
}

function validateSKey(skey: SKey, ids: string[]): void {
	const parts = skey.split("_");
	if (parts.length !== 2) {
		throw new InsightError("SKey is not in the correct format");
	}
	validateID(parts[0], ids);
	const validSFields: string[] = ["dept", "id", "instructor", "title", "uuid", "fullname", "shortname",
		"number", "name", "address", "type", "furniture", "href"];
	if (!validSFields.includes(parts[1] as string)) {
		throw new InsightError(`${parts[1]} is not a valid sfield type`);
	}
}

function validateNegation(negation: Negation, ids: string[]): void {
	return validateFilter(negation.NOT, ids);
}

const filterValidators: Record<string, (f: any, ids: string[]) => void> = {
	AND: validateLogicComparison,
	OR: validateLogicComparison,
	LT: validateMComparison,
	GT: validateMComparison,
	EQ: validateMComparison,
	IS: validateSComparison,
	NOT: validateNegation,
};

export function getFilterValidator(filter: string): ((f: any, ids: string[]) => void) | null {
	return filterValidators[filter] || null;
}
export function validateFilter(filter: Filter, ids: string[]): void {
	if (typeof filter !== "object" || filter === null || Array.isArray(filter)) {
		throw new InsightError(`Filter must be an object`);
	}
	const filters = Object.keys(filter);
	if (filters.length > 1) {
		throw new InsightError("More than 1 filter given");
	}
	if (filters.length < 1) {
		throw new InsightError("No filters given");
	}
	const validator = getFilterValidator(filters[0]);
	if (validator) {
		validator(filter, ids);
	} else {
		throw new InsightError("Invalid filter type");
	}
}

// OPTIONS VALIDATION

export function validateOptions(options: Options, ids: string[]): void {
	if (typeof options !== "object" || options === null || Array.isArray(options)) {
		throw new InsightError("OPTIONS must be an object");
	}

	validateColumns(options.COLUMNS, ids);
	if (options.ORDER) {
		validateOrder(options.ORDER, options.COLUMNS);
	}
}

function validateColumns(columns: Key[], ids: string[]): void {
	if (!columns || !Array.isArray(columns) || columns.length === 0) {
		throw new InsightError("COLUMNS must be a non-empty array");
	}

	for (const key of columns) {
		const parts = key.split("_");
		if (parts.length !== 2) {
			throw new InsightError("Column key is not in the correct format");
		}
		validateID(parts[0], ids);
		const validMFields: string[] = ["avg", "pass", "fail", "audit", "year"];
		const validSFields: string[] = ["dept", "id", "instructor", "title", "uuid"];
		if (!validSFields.includes(parts[1] as string) && !validMFields.includes(parts[1] as string)) {
			throw new InsightError(`${parts[1]} is not a valid sfield or mfield type`);
		}
	}
}

function validateOrder(order: Key, columns: Key[]): void {
	if (!columns.includes(order)) {
		throw new InsightError("Order key must be in COLUMNS key list");
	} else if (typeof order === "object") {
		if (!["UP", "DOWN"].includes(order.dir)) {
			throw new InsightError("ORDER direction must be UP or DOWN");
		}
		for (const key of order.keys) {
			if (!columns.includes(key)) {
				throw new InsightError("ORDER key must be in COLUMNS list");
			}
		}
	} else {
		throw new InsightError("Invalid ORDER format");
	}
}

function validateTransformations(transformations: Transformations, ids: string[]): void {
	if (typeof transformations !== "object" || transformations === null) {
		throw new InsightError("TRANSFORMATIONS must be an object");
	}

	validateGroup(transformations.GROUP, ids);
	validateApply(transformations.APPLY, ids);
}

function validateGroup(group: Group, ids: string[]): void {
	if (!Array.isArray(group) || group.length === 0) {
		throw new InsightError("GROUP must be a non-empty array");
	}
	for (const key of group) {
		validateKey(key, ids);
	}
}

function validateApply(apply: Apply, ids: string[]): void {
	const applyKeys = new Set();
	for (const rule of apply) {
		const applyKey = Object.keys(rule)[0];
		if (applyKeys.has(applyKey)) {
			throw new InsightError(`Duplicate apply key: '${applyKey}'`);
		}
		applyKeys.add(applyKey);
		validateApplyRule(rule[applyKey], ids);
	}
}

function validateApplyRule(applyRule: ApplyRule, ids: string[]): void {
	const { APPLYTOKEN, KEY } = applyRule;
	validateKey(KEY, ids);
	const numericTokens = new Set(["MAX", "MIN", "AVG", "SUM"]);
	if (numericTokens.has(APPLYTOKEN)) {
		if (!isNumericKey(KEY)) {
			throw new InsightError(`${APPLYTOKEN} can only be applied to numeric keys`);
		}
	}
}
