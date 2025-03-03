import { InsightDatasetKind } from "./IInsightFacade";

export interface Room {
	fullname: string; //  <td class="views-field views-field-title">
	shortname: string; // <td class="views-field views-field-field-building-code">
	number: string; // <td class="views-field views-field-field-room-number">
	name: string; // shortname + number
	address: string; // get from views-field views-field-field-building-address

	seats: number // <td class="views-field views-field-field-room-capacity">
	type: string; //  <td class="views-field views-field-field-room-type">
	furniture: string; // from the building file, <td class="views-field views-field-field-room-furniture">
	href: string; // <td class="views-field views-field-nothing">
	// <a href="http://students.ubc.ca/campus/discover/buildings-and-classrooms/room/ALRD-105">More info</a> </td>

	lat: number; // get this from geolocation api
	lon: number; // get this from geolocation api
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

export type Options = {
	COLUMNS: Key[];
	ORDER?: Key;
};

export interface QueryOptions {
	OPTIONS: {
		COLUMNS: Key[];
		ORDER?: Key;
	};
}

export type Query = QueryBody & QueryOptions;
