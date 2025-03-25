import './App.css'
import {NavLink} from 'react-router';
/*
Main landing page, click a button to get to the datasets page

*/
function App() {

  return (
    <>
		<h1 className="text-3xl font-bold underline">
			Hello world!
		</h1>
		<NavLink to={"/datasets"}>
			Click here to get started
		</NavLink>
	</>
  )
}

export default App
