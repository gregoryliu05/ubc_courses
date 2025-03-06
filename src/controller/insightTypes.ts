import { InsightDatasetKind } from "./IInsightFacade";

export interface Parse5Element {
	nodeName: string;
	tagName?: string;
	attrs?: { name: string; value: string }[];
	childNodes?: Parse5Element[];
}

export interface Parse5TextNode {
	nodeName: "#text";
	value: string;
	parentNode?: Parse5Element;
}

export interface Building {
	fullname: string; //  <td class="views-field views-field-title"> -> building title
	shortname: string; // <td class="views-field views-field-field-building-code"> -> building code
	address: string; // get from views-field views-field-field-building-address -> address
	href?: string; // <td class="views-field views-field-nothing"> -> href -> in an <a> in the <td>

	lat: number; // get this from geolocation api
	lon: number; // get this from geolocation api
}

export interface Room extends Building {
	number?: string; // <td class="views-field views-field-field-room-number">
	name?: string; // shortname + number
	seats?: number; // <td class="views-field views-field-field-room-capacity">
	type?: string; //  <td class="views-field views-field-field-room-type">
	furniture?: string; // from the building file, <td class="views-field views-field-field-room-furniture">
	// <a href="http://students.ubc.ca/campus/discover/buildings-and-classrooms/room/ALRD-105">More info</a> </td>
}

export interface GeoResponse {
	lat?: number;
	lon?: number;
	error?: string;
}

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

export interface CourseInfo {
	tier_eighty_five: number;
	tier_ninety: number;
	Title: string;
	Section: string;
	Detail: string;
	tier_seventy_two: number;
	Other: number;
	Low: number;
	tier_sixty_four: number;
	id: number;
	tier_sixty_eight: number;
	tier_zero: number;
	tier_seventy_six: number;
	tier_thirty: number;
	tier_fifty: number;
	Professor: string;
	Audit: number;
	tier_g_fifty: number;
	tier_forty: number;
	Withdrew: number;
	Year: string;
	tier_twenty: number;
	Stddev: number;
	Enrolled: number;
	tier_fifty_five: number;
	tier_eighty: number;
	tier_sixty: number;
	tier_ten: number;
	High: number;
	Course: string;
	Session: string;
	Pass: number;
	Fail: number;
	Avg: number;
	Campus: string;
	Subject: string;
}

export interface Dataset {
	id: string;
	kind: InsightDatasetKind;
	data: Section[] | Room[];
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

export type Sort = AnyKey | { dir: Direction; keys: AnyKey[] };

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
