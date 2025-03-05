import * as parse5 from "parse5";
import JSZip, { JSZipObject } from "jszip";
import * as http from "node:http";
import { GeoResponse, Room, Building, Parse5Element, Parse5TextNode } from "./insightTypes";
import { InsightError } from "./IInsightFacade";

export default class RoomsManager {
	private static async getGeolocation(address: string): Promise<GeoResponse> {
		// add validation to this -> is this necessary???
		return new Promise((resolve, reject) => {
			const options = {
				hostname: "cs310.students.cs.ubc.ca",
				port: 11316,
				path: `/api/v1/project_team257/${address}`,
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
			};

			http
				.get(options, (response) => {
					let data: string = "";
					let result: GeoResponse = {};

					response.on("data", (chunk) => {
						data += chunk;
					});

					response.on("end", () => {
						result = JSON.parse(data);
						resolve(result);
					});
				})
				.on("error", (error) => {
					reject(error);
				});
		});
	}

	// this will take all the html data, get it into tables
	// and then get it into rows
	// then get all the data -> look at each row separately as a building
	// get the view-content div
	// then get the table
	// then get the table body
	// then get all the tr
	private static async getValidBuildings(data: Parse5Element): Promise<Building[]> {
		let buildings: Building[] = [];

		const rows = this.getRowData(data);
		buildings = await Promise.all(
			rows.map(async (row) => {
				const fullNameCol = this.getDescendantsByClass(row, "views-field views-field-title")[0];
				const fullNameText = this.getDescendantsByTag(fullNameCol, "a")[0];
				const shortnameCol = this.getDescendantsByClass(row, "views-field views-field-field-building-code")[0];
				const addressCol = this.getDescendantsByClass(row, "views-field views-field-field-building-address")[0];
				const addressText = this.getTextOfNode(addressCol);
				const hrefNode = this.getDescendantsByClass(row, "views-field views-field-nothing")[0];
				const hrefText = this.getHrefData(hrefNode);
				const locationInfo:GeoResponse = await this.getGeolocation(encodeURIComponent(addressText));

				return {
					fullname: this.getTextOfNode(fullNameText),
					shortname: this.getTextOfNode(shortnameCol),
					address: addressText, // get from views-field views-field-field-building-address -> address
					href: hrefText, // <td class="views-field views-field-nothing"> -> href -> in an <a> in the <td>
					lat: locationInfo.lat as unknown as number, // get this from geolocation api
					lon: locationInfo.lon as unknown as number, // get this from geolocation api
				};
			})
		);
		return buildings;
	}

	// take all the buildings
	// need to get the file for each building to get the extra info
	// div view content
	// table views-table cols-5 table
	// get the tbody
	// then get each row -> each row is a room in the building
	// each room
	// get the href again for each room
	// push each room to the rooms
	private static async getValidRooms(buildings: Building[], data: JSZip): Promise<Room[]> {
		const rooms: Room[] = [];

		await Promise.all(
			buildings.map(async (building) => {
				const file = data.file(building.href.slice(2));
				if (!file) return;

				const info = await file.async("string");
				const rows = this.getRowData(parse5.parse(info) as Parse5Element);
				rows.forEach((row) => rooms.push(this.extractRoomData(row, building)));
			})
		);

		return rooms;
	}

	private static extractRoomData(row: Parse5Element, building: Building): Room {
		const getText: (cls: string) => string = (cls: string): string =>
			this.getTextOfNode(this.getDescendantsByClass(row, cls)[0]);
		const number = this.getTextOfNode(this.getDescendantsByTag(row, "a")[0])
		return {
			...building,
			number: number ,
			name: `${building.shortname}_${number}`,
			seats: parseInt(getText("views-field views-field-field-room-capacity")),
			type: getText("views-field views-field-field-room-type"),
			furniture: getText("views-field views-field-field-room-furniture"),
			href: this.getHrefData(this.getDescendantsByClass(row, "views-field views-field-nothing")[0]),
		};
	}

	public async processRooms(data: JSZip): Promise<Room[]> {
		if (!data.file("index.htm")) {
			throw new InsightError("no index htm file");
		}

		const buildingsInfo = data.folder("campus/discover/buildings-and-classrooms/");
		if (!buildingsInfo) {
			throw new InsightError("no buildings folder");
		}

		const file: JSZipObject = data.file("index.htm")!;
		const info: string = await file.async("string");

		const document = parse5.parse(info) as unknown as Parse5Element;

		const buildings = await RoomsManager.getValidBuildings(document);

		// building table within index file
		// room table within the building's html file
		const rooms: Room[] = await RoomsManager.getValidRooms(buildings, data);
		console.log(rooms);


		return rooms;
	}

	private static getDescendantsByTag(node: Parse5Element, tag: string, res: Parse5Element[] = []): Parse5Element[] {
		if (!node.childNodes) {
			return res;
		}
		const nodesArray = Array.from(node.childNodes);
		for (const childNode of nodesArray) {
			const child = childNode as unknown as Parse5Element;
			if (child.nodeName === tag) {
				res.push(child);
			}
			this.getDescendantsByTag(child, tag, res);
		}
		return res;
	}

	private static getDescendantsByClass(
		node: Parse5Element,
		tag: string,
		results: Parse5Element[] = []
	): Parse5Element[] {
		if (!node.childNodes) {
			return results;
		}
		const nodesArray: Parse5Element[] = Array.from(node.childNodes);
		for (const childNode of nodesArray) {
			const child = childNode as unknown as Parse5Element;
			if (child.attrs && child.attrs.length === 1 && child.attrs[0].value === tag) {
				results.push(child);
			}
		}
		return results;
	}

	private static getTextOfNode(node: Parse5Element): string {
		if (node.childNodes) {
			if (node.childNodes[0].nodeName === "#text") {
				return (node.childNodes[0] as Parse5TextNode).value.trim();
			}
		}
		return "";
	}

	private static getRowData(node: Parse5Element): Parse5Element[] {
		let tables = this.getDescendantsByTag(node, "table");
		tables = tables.filter((table) => {
			return table.attrs && table.attrs.length === 1 && table.attrs[0].value === "views-table cols-5 table";
		});
		if (!tables || tables.length === 0) {
			return [];
		}
		const table: Parse5Element = tables[0];

		const tableBody: Parse5Element = this.getDescendantsByTag(table, "tbody", [])[0];
		//console.log("tableBody", tableBody.nodeName)
		return this.getDescendantsByTag(tableBody, "tr", []);
	}

	private static getHrefData(node: Parse5Element): string {
		const hrefANode = this.getDescendantsByTag(node, "a")[0];
		if (!hrefANode?.attrs) {
			return "";
		}

		return hrefANode.attrs[0].value;
	}
}
