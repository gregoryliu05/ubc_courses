import { AnyKey, ApplyRule, ApplyToken, Key, MKey, SKey, TransformationsBody } from "./insightTypes";
import { InsightError } from "./IInsightFacade";
import { validateID, validateMKey, validateSKey } from "./QueryValidator";

export function validateTransformations(transformations: TransformationsBody, ids: string[], columns: AnyKey[]): void {
	if (typeof transformations !== "object" || transformations === null) {
		throw new InsightError("TRANSFORMATIONS must be an object");
	}

	validateGroup(transformations.GROUP, ids);
	validateApply(transformations.APPLY, ids);

	const validKeys = new Set<AnyKey>([...transformations.GROUP]);

	for (const rule of transformations.APPLY) {
		const applyKey = Object.keys(rule)[0]; // Extract applyKey
		validKeys.add(applyKey);
	}

	for (const column of columns) {
		if (!validKeys.has(column)) {
			throw new InsightError(`COLUMNS key '${column}' must be in GROUP or an applykey from APPLY`);
		}
	}
}

function validateGroup(group: Key[], ids: string[]): void {
	if (!group || !Array.isArray(group) || group.length === 0) {
		throw new InsightError("GROUP must be a non-empty array");
	}

	for (const key of group) {
		const parts = key.split("_");
		if (parts.length !== 2) {
			throw new InsightError(`${key} in GROUP is not a valid key format`);
		}
		validateID(parts[0], ids);

		const fieldType = parts[1];
		const validMFields: string[] = ["avg", "pass", "fail", "audit", "year", "lat", "lon", "seats"];
		if (validMFields.includes(fieldType)) {
			validateMKey(key as MKey, ids);
		} else {
			validateSKey(key as SKey, ids);
		}
	}
}

function validateApplyKey(applykey: string): void {
	// one or more of any character except underscore
	const pattern = new RegExp("[^_]+");
	if (!pattern.test(applykey)) {
		throw new InsightError(`Invalid applykey: ${applykey}`);
	}
}

function validateApply(apply: ApplyRule[], ids: string[]): void {
	if (!Array.isArray(apply)) {
		throw new InsightError("APPLY must be an array");
	}

	const applyKeys = new Set<string>();
	for (const rule of apply) {
		const applyKey = Object.keys(rule)[0];

		if (!applyKeys.has(applyKey)) {
			validateApplyKey(applyKey);
			applyKeys.add(applyKey);
		} else {
			throw new InsightError(`Duplicate applykey: ${applyKey}`);
		}

		const applyToken = getValidApplyToken(rule[applyKey]);
		const keyToValidate = rule[applyKey]?.[applyToken];

		if (!keyToValidate) {
			throw new InsightError(`Missing key for apply token ${applyToken} in apply rule ${applyKey}`);
		}
		validateApplyKeyType(keyToValidate, ids);

		validateApplyTokenUsage(applyToken, keyToValidate, ids);
	}
}

function getValidApplyToken(rule: any): ApplyToken {
	const key = Object.keys(rule)[0];
	if (!["MAX", "MIN", "AVG", "COUNT", "SUM"].includes(key)) {
		throw new Error(`Invalid apply token: ${key}`);
	}
	return key as ApplyToken;
}

function validateApplyKeyType(applyKeyType: string, ids: string[]): void {
	const parts = applyKeyType.split("_");
	if (parts.length !== 2) {
		throw new InsightError(`${applyKeyType} in APPLY is not a valid key format`);
	}
	validateID(parts[0], ids);
}

function validateApplyTokenUsage(applyToken: ApplyToken, key: string, ids: string[]): void {
	const validMFields = new Set(["avg", "pass", "fail", "audit", "year", "lat", "lon", "seats"]);

	if (applyToken === "COUNT") {
		validMFields.has(key.split("_")[1]) ? validateMKey(`${key}` as MKey, ids) : validateSKey(`${key}` as SKey, ids);
	} else {
		if (!validMFields.has(key.split("_")[1])) {
			throw new InsightError(`${key} is not a valid mfield type for ${applyToken}`);
		}
		validateMKey(`${key}` as MKey, ids);
	}
}
