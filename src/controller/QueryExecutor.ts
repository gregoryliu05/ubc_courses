import { Filter, Key, LogicComparison, MComparison, Negation, SComparison, Section } from "./insightTypes";
import { InsightError, InsightResult } from "./IInsightFacade";

export function applyFilter(section: Section, filter: Filter): boolean {
	const filterFunction = getFilterFunction(Object.keys(filter)[0]);
	if (filterFunction) {
		return filterFunction(section, filter);
	} else {
		throw new InsightError("Invalid filter type");
	}
}

const filterFunctions: Record<string, (section: Section, filter: any) => boolean> = {
	AND: applyLogicComparison,
	OR: applyLogicComparison,
	LT: applyMComparison,
	GT: applyMComparison,
	EQ: applyMComparison,
	IS: applySComparison,
	NOT: applyNegation,
};

export function getFilterFunction(filter: string): (section: Section, filter: Filter) => boolean {
	return filterFunctions[filter];
}

function applyLogicComparison(section: Section, filter: LogicComparison): boolean {
	if (filter.AND) {
		return applyAnd(section, filter);
	} else if (filter.OR) {
		return applyOr(section, filter);
	} else {
		return false;
	}
}

function applyMComparison(section: Section, filter: MComparison): boolean {
	if (filter.EQ) {
		return applyEq(section, filter);
	} else if (filter.GT) {
		return applyGt(section, filter);
	} else if (filter.LT) {
		return applyLt(section, filter);
	}
	return false;
}

function applySComparison(section: Section, filter: SComparison): boolean {
	return applyIs(section, filter);
}

function applyNegation(section: Section, filter: Negation): boolean {
	return !applyFilter(section, filter.NOT);
}

function applyAnd(section: Section, filter: LogicComparison): boolean {
	return filter.AND!.every((f) => applyFilter(section, f));
}

function applyOr(section: Section, filter: LogicComparison): boolean {
	return filter.OR!.some((f) => applyFilter(section, f));
}

function applyEq(section: Section, filter: MComparison): boolean {
	const body = filter.EQ!;
	const key = Object.keys(body)[0];
	const mfield: string = key.split("_")[1];
	const value = Object.values(body)[0];
	return (section[mfield as keyof Section] as number) === value;
}

function applyGt(section: Section, filter: MComparison): boolean {
	const body = filter.GT!;
	const key = Object.keys(body)[0];
	const mfield: string = key.split("_")[1];
	const value = Object.values(body)[0];
	return (section[mfield as keyof Section] as number) > value;
}

function applyLt(section: Section, filter: MComparison): boolean {
	const body = filter.LT!;
	const key = Object.keys(body)[0];
	const mfield: string = key.split("_")[1];
	const value = Object.values(body)[0];
	return (section[mfield as keyof Section] as number) < value;
}

function applyIs(section: Section, filter: SComparison): boolean {
	const body = filter.IS;
	const key = Object.keys(body)[0];
	const sfield: string = key.split("_")[1];
	const pattern = Object.values(body)[0];
	const value = section[sfield as keyof Section] as string;

	if (pattern.startsWith("*") && pattern.endsWith("*")) {
		const trimmedPattern = pattern.slice(1, -1);
		return value.includes(trimmedPattern);
	} else if (pattern.startsWith("*")) {
		const trimmedPattern = pattern.slice(1);
		return value.endsWith(trimmedPattern);
	} else if (pattern.endsWith("*")) {
		const trimmedPattern = pattern.slice(0, -1);
		return value.startsWith(trimmedPattern);
	} else {
		return value === pattern;
	}
}

function compare(a: InsightResult, b: InsightResult, key: Key): number {
	if (a[key] < b[key]) {
		return -1;
	} else if (a[key] > b[key]) {
		return 1;
	} else {
		return 0;
	}
}
export function sortResult(result: InsightResult[], key: Key): void {
	result.sort((a: InsightResult, b: InsightResult) => compare(a, b, key));
}

export function filterColumns(result: InsightResult[], keys: string[]): void {
	result.forEach((section) => {
		const keysToKeep: Record<string, string | number> = {};
		keys.forEach((k) => {
			const key = k.split("_")[1];
			if (key in section) {
				keysToKeep[k] = section[key];
			}
		});
		Object.keys(section).forEach((k) => {
			if (!(k in keysToKeep)) {
				delete section[k];
			}
		});
		Object.assign(section, keysToKeep);
	});
}
