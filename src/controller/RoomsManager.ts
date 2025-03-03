import * as parse5 from "parse5";
import JSZip, { JSZipObject } from "jszip";
import * as http from "node:http";
import { GeoResponse, Room } from "./insightTypes";
import { InsightError } from "./IInsightFacade";

export default class RoomsManager {
	// public getValidBuildings(data: JSZip) {
	// 	//const document = parse5.parse(data)
	// 	//return document
	// }
	//
	// public getValidRooms() {}
	//
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
					console.error("Error", error);
					reject(error);
				});
		});
	}

	public async processRooms(data: JSZip, id: string): Promise<Room[]> {
		if (!data.file("index.htm")) {
			throw new InsightError("no index htm file");
		}

		const buildingsInfo = data.folder("campus/discover/buildings-and-classrooms/");
		if (!buildingsInfo) {
			throw new InsightError("no buildings folder");
		}

		const file: JSZipObject = data.file("index.htm")!;
		const info: string = await file?.async("string");

		const rooms: Room[] = [];

		// building table within index file
		// room table within the building's html file

		const document = parse5.parse(info);
		console.log(document);
		//const htmlNode: Document = document.childNodes.find((node) => node.nodeName === "html") as unknown as Document;
		//const test: GeoResponse = await this.getGeolocation(encodeURIComponent("6245 Agronomy Road V6T 1Z4"));

		return rooms;
	}
}
