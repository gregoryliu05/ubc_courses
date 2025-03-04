import * as parse5 from "parse5";
import JSZip, { JSZipObject } from "jszip";
import * as http from "node:http";
import { GeoResponse, Room, Building, Parse5Element, Parse5TextNode } from "./insightTypes";
import { InsightError } from "./IInsightFacade";

export default class RoomsManager {
	public async getGeolocation(address: string): Promise<GeoResponse> {
		// add validation to this
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
					console.log("error", error)
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
	public async getValidBuildings(data: Parse5Element) {
		let buildings: Building[] = [];

		let divs: Parse5Element[] = this.getDescendantsByTag(data, "div", []);

		divs = divs.filter((div) => {
			return div.attrs && div.attrs.length === 1 && div.attrs[0].value === "view-content";
		});
		if (!divs) {
			throw new InsightError("invalid dataset");
		}
		const div:Parse5Element = divs[0]

		const table: Parse5Element = this.getDescendantsByTag(div, "table", [])[0]
		if (!table || (table.attrs && table.attrs[0].value !== "views-table cols-5 table")){
			throw new InsightError("invalid dataset")
		}
		const tableBody: Parse5Element = this.getDescendantsByTag(table, "tbody", [])[0]
		const rows = this.getDescendantsByTag(tableBody, "tr", [])
		buildings = await Promise.all(rows.map(async row => {
			const fullNameCol = this.getDescendantsByClass(row, "views-field views-field-title")[0];
			const fullNameText = this.getDescendantsByTag(fullNameCol, "a")[0];
			const shortnameCol = this.getDescendantsByClass(row, "views-field views-field-field-building-code")[0];
			const addressCol = this.getDescendantsByClass(row, "views-field views-field-field-building-address")[0];
			const addressText = this.getTextOfNode(addressCol)
			const hrefText = fullNameText.attrs?.[0]?.value ?? "";
			//const hrefInfo:GeoResponse = await this.getGeolocation(encodeURIComponent(addressText));

			return {
				fullname: this.getTextOfNode(fullNameText),
				shortname: this.getTextOfNode(shortnameCol),
				address: addressText, // get from views-field views-field-field-building-address -> address
				href: hrefText, // <td class="views-field views-field-nothing"> -> href -> in an <a> in the <td>
				// href should be like:
				lat:  0 ,  // get this from geolocation api
				lon:  0// get this from geolocation api
			}

		})
		)
		console.log(buildings)

		return buildings;
	}
	//
	// public getValidRooms() {}
	//

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

		const rooms: Room[] = [];

		const document = parse5.parse(info) as unknown as Parse5Element;

		console.log("check", await this.getGeolocation(encodeURIComponent("1871 West Mall")))

		const buildings = this.getValidBuildings(document);

		// building table within index file
		// room table within the building's html file


		const htmlNode = document.childNodes?.find((node) => node.nodeName === "html") as Parse5Element | undefined;
		if (!htmlNode) {
			throw new InsightError("HTML node not found");
		}

		//const result = this.getDescendantsByTag(htmlNode, "td", []);

		// i want to get all the tables and all the rows in each table
		// so i can get all the data i need
		// for (const node of result) {
		// 	if (node.attrs) {
		// 		for (const attr of node.attrs) {
		// 			if (attr.value === "views-field views-field-field-building-code") {
		// 				if (node.childNodes) {
		// 					if (node.childNodes[0].nodeName === "#text") {
		// 						console.log("Text content:", (node.childNodes[0] as Parse5TextNode).value.trim())
		// 					}
		// 				}
		//
		// 			}
		// 		}
		//}

		return rooms;
	}

	public getDescendantsByTag(node: Parse5Element, tag: string, results: Parse5Element[] = []): Parse5Element[] {
		if (!node.childNodes) {
			return results;
		}
		const nodesArray = Array.from(node.childNodes);
		for (const childNode of nodesArray) {
			const child = childNode as unknown as Parse5Element;
			if (child.nodeName === tag) {
				results.push(child);
			}
			this.getDescendantsByTag(child, tag, results);
		}
		return results;
	}

	public getDescendantsByClass(node: Parse5Element, tag: string, results: Parse5Element[] = []): Parse5Element[] {
		if (!node.childNodes) {
			return results;
		}
		const nodesArray: Parse5Element[] = Array.from(node.childNodes);
		for (const childNode of nodesArray) {
			const child = childNode as unknown as Parse5Element;
			if (child.attrs && child.attrs.length === 1 && child.attrs[0].value === tag) {
				results.push(child)
			}

		}
		return results;
	}

	public getTextOfNode(node: Parse5Element) {
		if (node.childNodes) {
			if (node.childNodes[0].nodeName === "#text") {
				return (node.childNodes[0] as Parse5TextNode).value.trim();
			}
		}
		return "";
	}
}
