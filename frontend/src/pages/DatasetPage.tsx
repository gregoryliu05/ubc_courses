
// Implement Data Insights part here -> use library
// USER STORIES: Filtering and Sorting Sections, Export Graphs as Images
import {useEffect, useState} from "react";
import {useParams} from 'react-router';
import {Query} from "../../../src/controller/insightTypes.ts";
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	BarElement,
	Title,
	Tooltip,
	Legend
} from 'chart.js';
import { Bar, Line } from "react-chartjs-2";
import "chart.js/auto";


ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);
// I need to make a new component for the graphs so i can just pass the id as props into it and then
// each query can just use it

const generalQuery = {
	"WHERE": {
		"GT": {
			"sections_avg":90
		}
	},
	"OPTIONS": {
		"COLUMNS": [
			"sections_uuid",
			"sections_id",
			"sections_title",
			"sections_instructor",
			"sections_dept",
			"sections_avg",
			"sections_pass",
			"sections_fail",
			"sections_audit"
		]
	}
}
const graph1query =  {
	"WHERE": {
	},
	"OPTIONS": {
		"COLUMNS": [
			"sections_dept",
			"totalAvg"
		],
		"ORDER": {
			"dir": "DOWN",
			"keys": ["totalAvg"]
		}
	},
	"TRANSFORMATIONS": {
		"GROUP": ["sections_dept"],
		"APPLY": [
			{ "totalAvg": { "AVG": "sections_avg" } }
		]
	}
}
const graph2query =  { // TODO: this one  I need to call twice split at 73
	"WHERE": {
		"LT": {
			"sections_avg":73
		}
	},
	"OPTIONS": {
		"COLUMNS": [
			"sections_instructor",
			"totalPass",
			"totalFail"
		],
		"ORDER": {
			"dir": "DOWN",
			"keys": ["totalFail"]
		}
	},
	"TRANSFORMATIONS": {
		"GROUP": ["sections_instructor"],
		"APPLY": [
			{ "totalPass": { "SUM": "sections_pass" } },
			{ "totalFail": { "SUM": "sections_fail" } }
		]
	}
}
const graph3query = {
		"WHERE": {
		},
		"OPTIONS": {
			"COLUMNS": [
				"sections_year",
				"totalSections"
			],
			"ORDER": {
				"dir": "DOWN",
				"keys": ["sections_year"]
			}
		},
		"TRANSFORMATIONS": {
			"GROUP": ["sections_year"],
			"APPLY": [
				{ "totalSections": { "COUNT": "sections_uuid"}}

			]
		}
	}
const queries = [generalQuery,graph1query, graph2query, graph3query]

const DatasetPage = () => {
	// I NEED 3 insights
	// avg of courses by dept by yr?
	// do post calls to api
	// use the dataset id as a param in the query
	// make the query the request body when i call the post
	const [graphData, setGraphData] = useState(null)
	const [loading, setLoading] = useState(true)
	const {datasetID} = useParams<{datasetID:string}>();


	useEffect(() => {
		console.log("testsststst", datasetID)
		const fetchWithErrorHandling = async (query:Query) => {
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


				setGraphData(responses)
			} catch (err) {
				console.log("Error with fetching the data from the queries", err)
				setGraphData(['test data', "test data"])
			} finally {
				setLoading(false)
			}
		}
		fetchQueryData()
		console.log(graphData)

	}, [datasetID]);

	return (
		<>
			<div>
				<Bar
					key={JSON.stringify(graphData)} // This forces remount
					data={{
						labels: ['CPSC', 'COMM', 'PSYC'],
						datasets: [
							{
								label: 'Average Grade',
								data: [80, 75, 56],
								backgroundColor: 'rgba(75, 192, 192, 0.6)',
							}
						]
					}}
					options={{
						responsive: true,
						plugins: {
							legend: {
								position: 'top'
							},
							title: {
								display: true,
								text: 'Department Averages'
							}
						}
					}}
				/>

			</div>
			<div>
			<Bar
				key={JSON.stringify(graphData)} // This forces remount
				data={{
					labels: ['gateman', 'holloway', 'alan'],
					datasets: [
						{
							label: 'Fail rate ',
							data: [6.5, 4.3, 2.3],
							backgroundColor: 'rgba(75, 192, 192, 0.6)',
						}
					]
				}}
				options={{
					indexAxis: 'y', // Horizontal bars
					plugins: {
						title: {
							display: true,
							text: 'Fail Rate by Instructor'
						}
					},
					scales: {
						x: {
							title: {
								display: true,
								text: 'Fail Rate (%)'
							},
							min: 0,
							max: 100
						},
						y: {
							title: {
								display: true,
								text: 'Instructor'
							}
						}
					}
				}}
			/>

		</div>
			<div>
				<Line
					key={JSON.stringify(graphData)} // This forces remount
					data={{
					labels: ["2020", "2021", "2022", "2023", "2024"],
					datasets: [
						{label: "Total Enrollment",
						data: [54000,55030, 60123, 59203, 23423], backgroundColor: 'rgba(75, 192, 192, 0.6)'
						}
						]
				}}
					  options = {{
						  responsive: true,
						  plugins: {
							  legend: {
								  position: 'top'
							  },
							  title: {
								  display: true,
								  text: 'Enrollment Count'
							  }
						  }
					  }}

				/>
			</div>
			<div>

			</div>

		</>
	)
}

export default DatasetPage;
