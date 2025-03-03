import { InsightDatasetKind } from "./IInsightFacade";

export interface Section {
	uuid: string;
	id: string;
	title: string;
	instructor: string;
	dept: string;
	year: number;
	avg: number;
	pass: number;
	fail: number;
	audit: number;
}

export interface Dataset {
	id: string;
	kind: InsightDatasetKind;
	data: Section[];
	numRows: number;
}

export type LogicOperator = "AND" | "OR";
export type MComparator = "LT" | "GT" | "EQ";

export type MField = "avg" | "pass" | "fail" | "audit" | "year" | "lat" | "lon" | "seats";
export type SField = "dept" | "id" | "instructor" | "title" | "uuid" | "fullname" | "shortname" | "number" | "name" | "address" | "type" | "furniture" | "href";

export type MKey = `${string}_${MField}`;
export type SKey = `${string}_${SField}`;
export type Key = MKey | SKey;
export type ApplyKey = string; // Apply keys must be unique and not contain underscores
export type AnyKey = Key | ApplyKey;

export type LogicComparison = {
	[key in LogicOperator]?: Filter[];
};

export type MComparison = {
	[key in MComparator]?: {
		[key: MKey]: number;
	};
};

export interface SComparison {
	IS: {
		[key: SKey]: string;
	};
}

export interface Negation {
	NOT: Filter;
}

export type Filter = LogicComparison | MComparison | SComparison | Negation;

export interface QueryBody {
	WHERE: Filter | {};
}

export type Direction = "UP" | "DOWN";

export interface Sort {
	ORDER: {
		dir: Direction;
		keys: AnyKey[];
	} | AnyKey;
}

export type Options = {
	COLUMNS: AnyKey[];
	ORDER?: Sort;
};

export interface QueryOptions {
	OPTIONS: Options;
}

export interface TransformationsBody {
	GROUP: Key[];
	APPLY: ApplyRule[];
}

export interface Transformations {
	TRANSFORMATIONS: TransformationsBody;
}

export type ApplyToken = "MAX" | "MIN" | "AVG" | "COUNT" | "SUM";

export interface ApplyRule {
	[applyKey: string]: {
		[applyToken in ApplyToken]: Key;
	};
}

export type Query = QueryBody & QueryOptions & Partial<Transformations>;
