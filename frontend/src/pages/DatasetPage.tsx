import {useEffect, useState} from "react";
import {useParams} from 'react-router';
import {MKey, Query} from "../../../src/controller/insightTypes.ts";
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	BarElement,
	Title,
	Tooltip,
	Legend
} from 'chart.js';
import { Bar, Line, Scatter } from "react-chartjs-2";
import "chart.js/auto";
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const DatasetPage = () => {
	const {datasetID} = useParams<{datasetID: string}>();
	const avgKey: MKey = `${datasetID}_avg`
	//const yearKey:string = `${datasetID}_year`

	const graph1query: Query = {
		"WHERE": {},
		"OPTIONS": {
			"COLUMNS": [
				`${datasetID}_dept`,
				"totalAvg"
			]
		},
		"TRANSFORMATIONS": {
			"GROUP": [`${datasetID}_dept`],
			"APPLY": [
				{"totalAvg": {"AVG": `${datasetID}_avg`}}
			]
		}
	}
	const graph2query: Query = {
		"WHERE": {
			"LT": {
				[avgKey]: 75
			}
		},
		"OPTIONS": {
			"COLUMNS": [
				`${datasetID}_instructor`,
				"totalPass",
				"totalFail"
			],
			"ORDER": {
				"dir": "DOWN",
				"keys": ["totalPass"]
			}
		},
		"TRANSFORMATIONS": {
			"GROUP": [`${datasetID}_instructor`],
			"APPLY": [
				{"totalPass": {"SUM": `${datasetID}_pass`}},
				{"totalFail": {"SUM": `${datasetID}_fail`}}
			]
		}
	}
	const graph2query2: Query = {
		"WHERE": {
			"GT": {
				[avgKey]: 74.99
			}
		},
		"OPTIONS": {
			"COLUMNS": [
				`${datasetID}_instructor`,
				"totalPass",
				"totalFail"
			],
			"ORDER": {
				"dir": "DOWN",
				"keys": ["totalPass"]
			}
		},
		"TRANSFORMATIONS": {
			"GROUP": [`${datasetID}_instructor`],
			"APPLY": [
				{"totalPass": {"SUM": `${datasetID}_pass`}},
				{"totalFail": {"SUM": `${datasetID}_fail`}}
			]
		}
	}
	const graph3query: Query = {
		"WHERE": {},
		"OPTIONS": {
			"COLUMNS": [
				`${datasetID}_year`,
				"totalSections"
			],
			"ORDER": {
				"dir": "UP",
				"keys": [`${datasetID}_year`]
			}
		},
		"TRANSFORMATIONS": {
			"GROUP": [`${datasetID}_year`],
			"APPLY": [
				{"totalSections": {"COUNT": `${datasetID}_uuid`}}

			]
		}
	}

	const queries: Query[] = [graph1query, graph2query, graph2query2, graph3query]

	type ResultRow = {
		[key: string]: string | number;
	}

	const [deptData, setDeptData] = useState<string[]>([])
	const [courseAvgData, setCourseAvgData] = useState<number[]>([])
	const [instructorData, setInstructorData] = useState<string[]>([])
	const [failRateData, setFailRateData] = useState<number[]>([])
	const [yearData, setYearData] = useState<number[]>([])
	const [sectionData, setSectionData] = useState<number[]>([])
	const [loading, setLoading] = useState(true)


	useEffect(() => {
		const fetchWithErrorHandling = async (query: Query) => {
			const res = await fetch("http://localhost:4321/query", {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify(query)
			});

			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			return await res.json();
		};

		const fetchQueryData = async () => {
			try {
				const responses = await Promise.all(
					queries.map(query => fetchWithErrorHandling(query)))

				const graph1Info = responses[0].result
				const deptInfo = graph1Info.map((row: ResultRow) => {
					return row[`${datasetID}_dept`];
				})
				setDeptData(deptInfo)

				const avgInfo = graph1Info.map((row: ResultRow) => {
					return row.totalAvg
				})
				setCourseAvgData(avgInfo)

				const merged: Record<string, ResultRow> = {};

				[...responses[1].result, ...responses[2].result].forEach((row) => {
					const instructor = row[`${datasetID}_instructor`];

					if (!merged[instructor]) {
						merged[instructor] = {...row};
					} else {
						merged[instructor].totalPass += row.totalPass;
						merged[instructor].totalFail += row.totalFail;
					}
				});

				let combined = Object.values(merged);
				combined = combined.filter((row) => row[`${datasetID}_instructor`] !== "")
				const instructorInfo: string[] = combined.map(
					(row: ResultRow) => `${row[`${datasetID}_instructor`]}`
				);
				setInstructorData(instructorInfo)
				const failRateInfo = combined.map(row =>
					(Number(row.totalFail) / (Number(row.totalFail) + Number(row.totalPass))) * 100)
				setFailRateData(failRateInfo)

				const graph3Info = responses[3].result.filter((row: ResultRow) => row[`${datasetID}_year`] !== 1900)
				const yearInfo = graph3Info.map((row: ResultRow) => {
					return row[`${datasetID}_year`]
				})
				const sectionsInfo = graph3Info.map((row: ResultRow) => {
					return row.totalSections
				})
				setYearData(yearInfo)
				setSectionData(sectionsInfo)

			} catch (err) {
				console.log("Error with fetching the data from the queries", err)
			} finally {
				setLoading(false)
			}
		}
		fetchQueryData()

	}, [datasetID]);

	return (
		<div className="px-6 py-4 space-y-6">
			<h1 className="text-2xl font-bold text-center text-gray-800">
				Dataset Overview: <span className="text-blue-600">{datasetID}</span>
			</h1>

			{loading ? (
				<div className="text-center text-lg text-gray-500">Loading...</div>
			) : (
				<>
					{/* Chart 1 - Scatterplot */}
					<div className="bg-white p-6 rounded-2xl shadow-md">
						<h2 className="text-lg font-semibold text-gray-700 mb-4">
							Department Averages (Scatter Plot)
						</h2>
						<Scatter
							data={{
								datasets: [
									{
										label: 'Average Grade',
										data: deptData.map((dept, index) => ({
											x: index,
											y: courseAvgData[index],
											label: dept,
										})),
										backgroundColor: 'rgba(75, 192, 192, 0.6)',
									},
								],
							}}
							options={{
								responsive: true,
								plugins: {
									legend: {position: 'top'},
									title: {
										display: true,
										text: 'Department Averages',
									},
									tooltip: {
										callbacks: {
											label: (context) => {
												const dept = deptData[context.dataIndex];
												const point = context.raw as {
													x: number;
													y: number;
													label: string;
												};
												const avg = point.y.toFixed(2);
												return `${dept}: ${avg}`;
											},
										},
									},
								},
								scales: {
									x: {
										title: {display: true, text: 'Department Index'},
									},
									y: {
										title: {display: true, text: 'Average Grade'},
										beginAtZero: true,
										min: 50,
										max: 100,
									},
								},
							}}
						/>
					</div>

					{/* Chart 2 - Fail Rate by Instructor */}
					<div className="bg-white p-6 rounded-2xl shadow-md">
						<h2 className="text-lg font-semibold text-gray-700 mb-4">
							Fail Rate by Top 20 Instructors
						</h2>
						<Bar
							data={{
								labels: instructorData.slice(0, 20),
								datasets: [
									{
										label: 'Fail rate',
										data: failRateData.slice(0, 20),
										backgroundColor: 'rgba(75, 192, 192, 0.6)',
									},
								],
							}}
							options={{
								plugins: {
									title: {
										display: true,
										text: 'Fail Rate of Top 20 Instructors That Teach the Most Students',
									},
								},
								scales: {
									x: {
										title: {display: true, text: 'Instructor'},
									},
									y: {
										title: {display: true, text: 'Fail Rate (%)'},
									},
								},
							}}
						/>
					</div>

					{/* Chart 3 - Line Chart for Section Counts */}
					<div className="bg-white p-6 rounded-2xl shadow-md">
						<h2 className="text-lg font-semibold text-gray-700 mb-4">
							Section Count by Year
						</h2>
						<Line
							data={{
								labels: yearData,
								datasets: [
									{
										label: 'Total Sections',
										data: sectionData,
										backgroundColor: 'rgba(75, 192, 192, 0.6)',
									},
								],
							}}
							options={{
								responsive: true,
								plugins: {
									legend: {position: 'top'},
									title: {
										display: true,
										text: '# of Total Class Sections by Year',
									},
								},
							}}
						/>
					</div>
				</>
			)}
		</div>
	);
}


export default DatasetPage;
