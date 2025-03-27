import { useEffect, useState } from "react";
import { NavLink } from "react-router";

const HomePage = () => {
	// USER STORIES: Basic Dataset Display, Viewing Dataset Details, Sorting Datasets by Name, Filter Datasets
	interface Dataset {
		id: string;
		kind: string;
		numRows: number;
	}

	const [datasets, setDatasets] = useState<Dataset[]>([]);
	const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({});
	const [showPopup, setShowPopup] = useState(false);
	const [datasetId, setDatasetId] = useState("");
	const [kind, setKind] = useState("sections");
	const [file, setFile] = useState<File | null>(null);
	const [refresh, setRefresh] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");

	useEffect(() => {
		const fetchDatasets = async () => {
			try {
				const response = await fetch("http://localhost:4321/datasets");
				if (!response.ok) {
					throw new Error("Network response was not ok");
				}
				const data = await response.json();
				console.log("Fetched datasets:", data);
				setDatasets(data.result);
			} catch (error) {
				console.error("Error fetching datasets:", error);
			}
		};

		fetchDatasets();
	}, [refresh]);

	const toggleDropdown = (id: string) => {
		setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
	};

	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		if (event.target.files) {
			setFile(event.target.files[0]);
		}
	};

	const handleSubmit = async () => {
		try {
			const response = await fetch(`http://localhost:4321/dataset/${datasetId}/${kind}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/zip",
				},
				body: file,
			});

			if (!response.ok) {
				const errResponse = await response.json();
				throw new Error(errResponse.error);
			}
			setShowPopup(false);
			setRefresh((prev) => !prev);
		} catch (error) {
			alert(error);
			console.error("Error uploading dataset:", error);
		}
	};

	const handleDelete = async (datasetId: string) => {
		try {
			const response = await fetch(`http://localhost:4321/dataset/${datasetId}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				const errResponse = await response.json();
				throw new Error(errResponse.error);
			}

			setRefresh((prev) => !prev);

			alert("Dataset deleted successfully!");
		} catch (error) {
			alert(error);
			console.error("Error deleting dataset:", error);
		}
	};

	const filteredDatasets = datasets.filter((dataset) => dataset.id.toLowerCase().includes(searchQuery.toLowerCase()));

	return (
		<>
			<div className="text-4xl font-bold text-black pt-32 ml-36">Datasets</div>
			<div className="justify-center flex w-full pt-8">
				<div className="justify-end flex w-2/3">
					<div className="pt-4 w-64">
						<input
							type="text"
							placeholder="Search by Dataset ID"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-full bg-gray-100 px-5 py-2 rounded-full text-sm"
						/>
					</div>
				</div>
			</div>
			<div className="h-full w-full justify-center flex">
				<ul className="w-2/3 pt-6">
					{filteredDatasets.map((dataset) => (
						<div key={dataset.id} className="pb-2">
							<div
								className="flex justify-between items-center p-3 text-black rounded-lg bg-gray-100"
								onClick={() => toggleDropdown(dataset.id)}
							>
								<NavLink to={`/datasets/${dataset.id}`} className="font-normal pl-2">
									{dataset.id}
								</NavLink>
								<span className="text-sm text-gray-500">{expanded[dataset.id] ? "▲" : "▼"}</span>
							</div>
							{expanded[dataset.id] && (
								<div className="justify-between flex pl-3 text-sm">
									<div className="p-3 bg-white flex gap-6">
										<div className="flex gap-3">
											<div className="font-medium">Kind</div>
											<div>{dataset.kind}</div>
										</div>
										<div className="flex gap-3">
											<div className="font-medium">Rows</div>
											<div>{dataset.numRows}</div>
										</div>
									</div>
									<div className="p-3">
										<button
											className="px-4 py-1 bg-[#ff5252] text-white font-light text-sm rounded-full cursor-pointer"
											onClick={() => handleDelete(dataset.id)}
										>
											Delete
										</button>
									</div>
								</div>
							)}
						</div>
					))}
					<div className="pb-2">
						<div
							className="flex items-center p-3 justify-center text-gray-500 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer mb-12"
							onClick={() => setShowPopup(true)}
						>
							+
						</div>
					</div>
				</ul>
			</div>

			{showPopup && (
				<div className="fixed inset-0 flex justify-center items-center bg-gray-50/75">
					<div className="bg-white px-16 py-10 rounded-3xl shadow-lg w-1/3 relative">
						<button className="absolute top-4 right-8 text-2xl text-gray-300" onClick={() => setShowPopup(false)}>
							&times;
						</button>
						<h2 className="text-2xl font-semibold pt-6">Upload Dataset</h2>
						<div className="mt-4">
							<label className="block text-sm font-normal pb-1 text-gray-500">Dataset ID</label>
							<input
								type="text"
								value={datasetId}
								onChange={(e) => setDatasetId(e.target.value)}
								className="w-full p-2 border rounded-md"
								placeholder="Enter dataset ID"
							/>
						</div>
						<div className="mt-4">
							<label className="block text-sm font-normal pb-1 text-gray-500">Kind</label>
							<select value={kind} onChange={(e) => setKind(e.target.value)} className="w-full p-2 border rounded-md">
								<option value="rooms">Rooms</option>
								<option value="sections">Sections</option>
							</select>
						</div>
						<div className="mt-4">
							<label className="block text-sm font-normal pb-1 text-gray-500">Upload ZIP File</label>
							<input type="file" accept=".zip" onChange={handleFileChange} className="w-full p-2 border rounded-md" />
						</div>
						<div className="mt-6 flex justify-end">
							<button className="px-5 py-2 bg-[#4caf50] text-white rounded-full cursor-pointer" onClick={handleSubmit}>
								Upload
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	);
};

export default HomePage;
