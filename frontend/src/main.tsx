import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from "react-router";
import './index.css'
import App from './App.tsx'
import DatasetPage from "./pages/DatasetPage.tsx";
import HomePage from "./pages/HomePage.tsx";


const root = document.getElementById("root")

createRoot(root!).render(
  <StrictMode>
	  <BrowserRouter>
		  <Routes>
			  <Route path="/" element={<App />} >
			  </Route>
			  <Route path = "/datasets" element = {<HomePage/>}>
			  </Route>
			  <Route path = "/datasets/:datasetID" element={<DatasetPage/>}/>
		  </Routes>
	  </BrowserRouter>
  </StrictMode>,
)
