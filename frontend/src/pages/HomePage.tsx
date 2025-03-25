import {useState} from "react";
import {NavLink} from "react-router";


const HomePage = () => {
	// Implement add and remove datasets here -> addDataset on another page/component
	// USER STORIES: Basic Dataset Display, Viewing Dataset Details, Sorting Datasets by Name, Filter Datasets

	// can delete, this was just example test data
	const [datasets, setDatasets] = useState(['location', "location2"])

	return (
		<>
			<h1>This is the home page</h1>
			{datasets.map((dataset: string) => (
				<div key={dataset}>
					<NavLink to={`/datasets/${dataset}`}>
						click here
					</NavLink>
					<p>loLloL</p>
				</div>
			))}
		</>
	);
};


export default HomePage;
