import React, { useState } from "react";

const UploadPopup = () => {
	const [file, setFile] = useState<File | null>(null);
	const [datasetId, setDatasetId] = useState("");
	const [datasetKind, setDatasetKind] = useState("sections");
	console.log(file)

	// Handle file selection from file explorer
	const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
		if (event.target.files && event.target.files.length > 0) {
			setFile(event.target.files[0]);
			handleUpload(event.target.files[0]);
		}
	};

	// Handle the file upload to the server using fetch
	const handleUpload = async (file: File) => {
		if (!datasetId || !file) {
			alert("Please provide a dataset ID and choose a file.");
			return;
		}

		try {
			const fileData = await file.arrayBuffer(); // Convert file to raw binary

			// Send PUT request to the API with the binary ZIP data using fetch
			const response = await fetch(`http://localhost:4321/dataset/${datasetId}/${datasetKind}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/octet-stream", // Binary data
				},
				body: fileData, // Raw binary of the file
			});

			if (!response.ok) {
				throw new Error(`Failed to upload dataset: ${response.statusText}`);
			}

			const result = await response.json();
			alert(`Dataset uploaded successfully: ${JSON.stringify(result)}`);
		} catch (error: any) {
			alert(`Error uploading dataset: ${error.message}`);
		}
	};

	return (
		<div className="p-4 bg-gray-100 rounded-lg shadow-md w-96">
			<h2 className="text-lg font-bold mb-2">Upload Dataset</h2>

			{/* Dataset ID Input */}
			<input
				type="text"
				placeholder="Enter dataset ID"
				value={datasetId}
				onChange={(e) => setDatasetId(e.target.value)}
				className="w-full p-2 border rounded mb-2"
			/>

			{/* Dataset Kind Selection */}
			<select
				value={datasetKind}
				onChange={(e) => setDatasetKind(e.target.value)}
				className="w-full p-2 border rounded mb-2"
			>
				<option value="sections">Sections</option>
				<option value="rooms">Rooms</option>
			</select>

			{/* Upload Button */}
			<input type="file" accept=".zip" onChange={handleFileSelection} className="hidden" id="file-upload" />
			<label htmlFor="file-upload">
				<button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Upload Dataset</button>
			</label>
		</div>
	);
};

export default UploadPopup;
