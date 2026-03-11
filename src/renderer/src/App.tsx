import { Route, Routes } from 'react-router-dom';
import { LearningView } from './pages/LearningView';
import { StartMenu } from './pages/StartMenu';

function App() {
	return (
		<Routes>
			<Route path="/" element={<StartMenu />} />
			<Route path="/part/:id" element={<LearningView />} />
		</Routes>
	);
}

export default App;
