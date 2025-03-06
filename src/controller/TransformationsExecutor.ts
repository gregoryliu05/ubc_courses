import { AnyKey, ApplyRule, Key, TransformationsBody } from "./insightTypes";
import Decimal from "decimal.js";
import { InsightResult } from "./IInsightFacade";

const applyMap: Record<string, (group: InsightResult[], applyRule: ApplyRule) => number> = {
	MIN: applyMin,
	MAX: applyMax,
	AVG: applyAvg,
	SUM: applySum,
	COUNT: applyCount,
};
export function executeTransformations(
	results: InsightResult[],
	transformations: TransformationsBody,
	columns: AnyKey[]
): InsightResult[] {
	const groups = executeGroup(results, transformations.GROUP);
	const groupKeys = transformations.GROUP;
	const groupsArray = Object.values(groups);

	return executeApply(groupsArray, transformations.APPLY, groupKeys, columns);
}

export function executeGroup(items: InsightResult[], groupKeys: Key[]): Record<string, InsightResult[]> {
	const resultMap = {} as Record<string, InsightResult[]>;

	return items.reduce((map, item) => {
		const keyArray = getGroupKey(item, groupKeys);
		const key = JSON.stringify(keyArray);

		if (!map[key]) {
			map[key] = [];
		}
		map[key].push(item);
		return map;
	}, resultMap);
}

function getGroupKey(item: InsightResult, groupKeys: Key[]): any[] {
	return groupKeys.map((key) => {
		const field = key.split("_")[1];
		return item[field];
	});
}
function executeApply(
	groups: InsightResult[][],
	apply: ApplyRule[],
	groupKeys: Key[],
	columns: AnyKey[]
): InsightResult[] {
	const results: InsightResult[] = [];

	for (const group of groups) {
		let item: Record<string, string | number> = {};
		const head = group[0];

		if (apply.length > 0) {
			item = executeGroupApply(group, apply, columns);
		}

		for (const groupKey of groupKeys) {
			const groupKeyParts = groupKey.split("_");
			const groupKeyField = groupKeyParts[1];
			item[groupKey] = head[groupKeyField];
		}

		results.push(item);
	}

	return results;
}

function executeGroupApply(
	group: InsightResult[],
	apply: ApplyRule[],
	columns: AnyKey[]
): Record<string, string | number> {
	const item: Record<string, string | number> = {};

	for (const applyRule of apply) {
		const [applyKey, applyObj] = Object.entries(applyRule)[0];
		const [applyToken] = Object.keys(applyObj);

		if (!columns.includes(applyKey)) continue;

		item[applyKey] = applyMap[applyToken](group, applyRule);
	}

	return item;
}

function applyMin(group: InsightResult[], applyRule: ApplyRule): number {
	const minObj = Object.values(applyRule)[0];
	const field = minObj?.MIN.toString().split("_")[1];

	const head = group[0];

	let minimum: number = Number.parseFloat(head[field] as string);
	for (const item of group) {
		const value: number = Number.parseFloat(item[field] as string);
		minimum = Math.min(minimum, value);
	}

	return minimum;
}

function applyMax(group: InsightResult[], applyRule: ApplyRule): number {
	const maxObj = Object.values(applyRule)[0];

	const field = maxObj?.MAX.toString().split("_")[1];

	const head = group[0];
	let maximum: number = Number.parseFloat(head[field] as string);
	for (const item of group) {
		const value: number = Number.parseFloat(item[field] as string);
		maximum = Math.max(maximum, value);
	}

	return maximum;
}

function applyAvg(group: InsightResult[], applyRule: ApplyRule): number {
	const avgObj = Object.values(applyRule)[0];

	const field = avgObj?.AVG.toString().split("_")[1];

	let total: Decimal = new Decimal(0);
	const numRows = group.length;

	for (const item of group) {
		const value = new Decimal(item[field]);
		total = total.add(value);
	}

	const avg = total.toNumber() / numRows;

	return Number(avg.toFixed(2));
}

function applySum(group: InsightResult[], applyRule: ApplyRule): number {
	const sumObj = Object.values(applyRule)[0];

	const field = sumObj?.SUM.toString().split("_")[1];

	let sum: number = 0;
	for (const item of group) {
		const value: number = Number.parseFloat(item[field] as string);
		sum += value;
	}

	return Number(sum.toFixed(2));
}
function applyCount(group: InsightResult[], applyRule: ApplyRule): number {
	const countObj = Object.values(applyRule)[0];

	const field = countObj?.COUNT.toString().split("_")[1];

	const set = new Set();
	for (const item of group) {
		const value = item[field];
		set.add(value);
	}

	return set.size;
}
