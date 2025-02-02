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

export type LogicOperator = "AND" | "OR";
export type MComparator = "LT" | "GT" | "EQ";

export type MField = "avg" | "pass" | "fail" | "audit" | "year";
export type SField = "dept" | "id" | "instructor" | "title" | "uuid";

export type MKey = `${string}_${MField}`;
export type SKey = `${string}_${SField}`;
export type Key = MKey | SKey;

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

export interface QueryOptions {
	OPTIONS: {
		COLUMNS: Key[];
		ORDER?: Key;
	};
}

export type Query = QueryBody & QueryOptions;
